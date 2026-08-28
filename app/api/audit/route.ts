import { env } from "cloudflare:workers";
import { authorize } from "@/src/core/authorization/service";

export async function GET() {
  const context = await authorize("audit.read");
  const events = await env.DB.prepare(
    `SELECT id, actor_user_id AS actorUserId, action, target_type AS targetType,
      target_id AS targetId, metadata_json AS metadataJson, created_at AS createdAt
     FROM audit_events WHERE workspace_id = ? ORDER BY created_at DESC LIMIT 100`,
  ).bind(context.workspace.id).all();
  return Response.json(events.results);
}
