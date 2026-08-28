import { env } from "cloudflare:workers";
import { requireSessionUser } from "@/src/core/identity/session";
import { sha256 } from "@/src/core/identity/crypto";
import { writeAuditEvent } from "@/src/core/audit/service";

export async function POST(request: Request) {
  const user = await requireSessionUser();
  const body = await request.json() as { token?: string };
  if (!body.token) return Response.json({ error: "Invitation token is required" }, { status: 400 });
  const now = Date.now();
  const invitation = await env.DB.prepare(
    `SELECT id, workspace_id AS workspaceId, email, role FROM invitations
     WHERE token_hash = ? AND accepted_at IS NULL AND expires_at > ?`,
  ).bind(await sha256(body.token), now).first<{ id: string; workspaceId: string; email: string; role: string }>();
  if (!invitation || invitation.email !== user.email.toLowerCase()) return Response.json({ error: "Invitation is invalid or belongs to another email" }, { status: 403 });
  await env.DB.batch([
    env.DB.prepare("INSERT OR IGNORE INTO memberships (id, user_id, workspace_id, role, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind(crypto.randomUUID(), user.id, invitation.workspaceId, invitation.role, now),
    env.DB.prepare("UPDATE invitations SET accepted_at = ? WHERE id = ? AND accepted_at IS NULL").bind(now, invitation.id),
  ]);
  await writeAuditEvent({ workspaceId: invitation.workspaceId, actorUserId: user.id, action: "member.joined", targetType: "invitation", targetId: invitation.id });
  return Response.json({ ok: true, workspaceId: invitation.workspaceId, dashboardUrl: "/dashboard" });
}
