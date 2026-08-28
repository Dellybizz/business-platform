import { env } from "cloudflare:workers";
import { requireSessionUser } from "@/src/core/identity/session";

export async function GET() {
  const user = await requireSessionUser();
  const sessions = await env.DB.prepare(
    `SELECT id, created_at AS createdAt, last_seen_at AS lastSeenAt, expires_at AS expiresAt
     FROM sessions WHERE user_id = ? AND revoked_at IS NULL AND expires_at > ?
     ORDER BY last_seen_at DESC`,
  ).bind(user.id, Date.now()).all();
  return Response.json(sessions.results);
}

export async function DELETE(request: Request) {
  const user = await requireSessionUser();
  const sessionId = new URL(request.url).searchParams.get("id");
  if (!sessionId) return Response.json({ error: "Session id is required" }, { status: 400 });
  const result = await env.DB.prepare(
    "UPDATE sessions SET revoked_at = ? WHERE id = ? AND user_id = ? AND revoked_at IS NULL",
  ).bind(Date.now(), sessionId, user.id).run();
  if (!Number(result.meta.changes || 0)) return Response.json({ error: "Session not found" }, { status: 404 });
  return Response.json({ ok: true });
}
