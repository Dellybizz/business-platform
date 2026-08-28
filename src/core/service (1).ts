import { env } from "cloudflare:workers";

export async function writeAuditEvent(input: {
  workspaceId?: string | null;
  actorUserId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await env.DB.prepare(
    "INSERT INTO audit_events (id, workspace_id, actor_user_id, action, target_type, target_id, metadata_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  ).bind(
    crypto.randomUUID(),
    input.workspaceId ?? null,
    input.actorUserId ?? null,
    input.action,
    input.targetType,
    input.targetId ?? null,
    JSON.stringify(input.metadata ?? {}),
    Date.now(),
  ).run();
}
