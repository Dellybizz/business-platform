import { env } from "cloudflare:workers";
import { authorize } from "@/src/core/authorization/service";
import { hashSecret, verifySecret } from "@/src/core/identity/crypto";
import { writeAuditEvent } from "@/src/core/audit/service";

export async function PUT(request: Request) {
  const context = await authorize("pos.manage");
  const body = await request.json() as { userId?: string; pin?: string };
  if (!body.userId || !/^\d{4,8}$/.test(body.pin || "")) return Response.json({ error: "User and a 4–8 digit PIN are required" }, { status: 400 });
  const member = await env.DB.prepare("SELECT id FROM memberships WHERE workspace_id = ? AND user_id = ?").bind(context.workspace.id, body.userId).first();
  if (!member) return Response.json({ error: "Staff member not found" }, { status: 404 });
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO staff_pin_credentials (id, workspace_id, user_id, pin_hash, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(workspace_id, user_id) DO UPDATE SET pin_hash = excluded.pin_hash, updated_at = excluded.updated_at, disabled_at = NULL`,
  ).bind(crypto.randomUUID(), context.workspace.id, body.userId, await hashSecret(body.pin!), now, now).run();
  await writeAuditEvent({ workspaceId: context.workspace.id, actorUserId: context.user.id, action: "staff_pin.updated", targetType: "user", targetId: body.userId });
  return Response.json({ ok: true });
}

export async function POST(request: Request) {
  const context = await authorize("pos.sell");
  const body = await request.json() as { pin?: string };
  const credential = await env.DB.prepare(
    "SELECT pin_hash AS pinHash FROM staff_pin_credentials WHERE workspace_id = ? AND user_id = ? AND disabled_at IS NULL",
  ).bind(context.workspace.id, context.user.id).first<{ pinHash: string }>();
  const valid = Boolean(credential && body.pin && await verifySecret(body.pin, credential.pinHash));
  return valid ? Response.json({ ok: true }) : Response.json({ error: "PIN is incorrect" }, { status: 401 });
}
