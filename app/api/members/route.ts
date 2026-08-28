import { env } from "cloudflare:workers";
import { authorize } from "@/src/core/authorization/service";
import { isStaffRole } from "@/src/core/authorization/permissions";
import { randomToken, sha256 } from "@/src/core/identity/crypto";
import { writeAuditEvent } from "@/src/core/audit/service";

export async function GET() {
  try {
    const context = await authorize("members.read");
    const [members, invitations] = await env.DB.batch([
      env.DB.prepare(
        `SELECT m.id, m.role, u.id AS userId, u.email, u.display_name AS displayName
         FROM memberships m JOIN users u ON u.id = m.user_id
         WHERE m.workspace_id = ? ORDER BY m.created_at`,
      ).bind(context.workspace.id),
      env.DB.prepare(
        `SELECT id, email, role, expires_at AS expiresAt, created_at AS createdAt
         FROM invitations WHERE workspace_id = ? AND accepted_at IS NULL ORDER BY created_at DESC`,
      ).bind(context.workspace.id),
    ]);
    return Response.json({ members: members.results, invitations: invitations.results, currentUserId: context.user.id, currentRole: context.role });
  } catch (error) { return fail(error); }
}

export async function POST(request: Request) {
  try {
    const context = await authorize("members.invite");
    const body = await request.json() as { email?: string; role?: string };
    const email = body.email?.trim().toLowerCase() || "";
    if (!/^\S+@\S+\.\S+$/.test(email)) return Response.json({ error: "Enter a valid email address" }, { status: 400 });
    if (!isStaffRole(body.role) || body.role === "owner") return Response.json({ error: "Choose a valid staff role" }, { status: 400 });
    if (context.role !== "owner" && body.role === "administrator") return Response.json({ error: "Only owners can invite administrators" }, { status: 403 });
    const existing = await env.DB.prepare(
      `SELECT m.id FROM memberships m JOIN users u ON u.id = m.user_id
       WHERE m.workspace_id = ? AND u.email = ?`,
    ).bind(context.workspace.id, email).first();
    if (existing) return Response.json({ error: "This person is already a member" }, { status: 409 });
    const token = randomToken();
    const id = crypto.randomUUID();
    const now = Date.now();
    await env.DB.prepare(
      "INSERT INTO invitations (id, workspace_id, email, role, token_hash, invited_by, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    ).bind(id, context.workspace.id, email, body.role, await sha256(token), context.user.id, now + 7 * 24 * 60 * 60 * 1000, now).run();
    await writeAuditEvent({ workspaceId: context.workspace.id, actorUserId: context.user.id, action: "member.invited", targetType: "invitation", targetId: id, metadata: { email, role: body.role } });
    return Response.json({ id, inviteUrl: `/invite?token=${encodeURIComponent(token)}` }, { status: 201 });
  } catch (error) { return fail(error); }
}

export async function PATCH(request: Request) {
  try {
    const context = await authorize("members.manage");
    const body = await request.json() as { membershipId?: string; role?: string };
    if (!body.membershipId || !isStaffRole(body.role) || body.role === "owner") return Response.json({ error: "Membership and valid staff role are required" }, { status: 400 });
    const target = await env.DB.prepare(
      "SELECT user_id AS userId, role FROM memberships WHERE id = ? AND workspace_id = ?",
    ).bind(body.membershipId, context.workspace.id).first<{ userId: string; role: string }>();
    if (!target) return Response.json({ error: "Member not found" }, { status: 404 });
    if (target.role === "owner") return Response.json({ error: "The workspace owner role cannot be changed" }, { status: 403 });
    if (target.userId === context.user.id) return Response.json({ error: "You cannot change your own role" }, { status: 403 });
    if (context.role !== "owner" && body.role === "administrator") return Response.json({ error: "Only owners can assign administrators" }, { status: 403 });
    await env.DB.prepare("UPDATE memberships SET role = ? WHERE id = ? AND workspace_id = ?").bind(body.role, body.membershipId, context.workspace.id).run();
    await writeAuditEvent({ workspaceId: context.workspace.id, actorUserId: context.user.id, action: "member.role_changed", targetType: "membership", targetId: body.membershipId, metadata: { from: target.role, to: body.role } });
    return Response.json({ ok: true });
  } catch (error) { return fail(error); }
}

export async function DELETE(request: Request) {
  try {
    const context = await authorize("members.manage");
    const membershipId = new URL(request.url).searchParams.get("membershipId");
    if (!membershipId) return Response.json({ error: "Membership is required" }, { status: 400 });
    const target = await env.DB.prepare(
      "SELECT user_id AS userId, role FROM memberships WHERE id = ? AND workspace_id = ?",
    ).bind(membershipId, context.workspace.id).first<{ userId: string; role: string }>();
    if (!target) return Response.json({ error: "Member not found" }, { status: 404 });
    if (target.role === "owner" || target.userId === context.user.id) return Response.json({ error: "You cannot remove this member" }, { status: 403 });
    await env.DB.prepare("DELETE FROM memberships WHERE id = ? AND workspace_id = ?").bind(membershipId, context.workspace.id).run();
    await writeAuditEvent({ workspaceId: context.workspace.id, actorUserId: context.user.id, action: "member.removed", targetType: "membership", targetId: membershipId });
    return Response.json({ ok: true });
  } catch (error) { return fail(error); }
}

function fail(error: unknown) {
  return error instanceof Response ? error : Response.json({ error: error instanceof Error ? error.message : "Unexpected error" }, { status: 500 });
}
