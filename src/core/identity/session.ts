import { cookies } from "next/headers";
import { env } from "cloudflare:workers";
import { randomToken, sha256 } from "./crypto";

const SESSION_COOKIE = "modulo_session";
const SESSION_LIFETIME = 30 * 24 * 60 * 60 * 1000;

export type SessionUser = { id: string; email: string; displayName: string };

export async function createSession(userId: string) {
  const token = randomToken();
  const now = Date.now();
  await env.DB.prepare(
    "INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?)",
  ).bind(crypto.randomUUID(), userId, await sha256(token), now + SESSION_LIFETIME, now, now).run();
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: SESSION_LIFETIME / 1000,
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const now = Date.now();
  const row = await env.DB.prepare(
    `SELECT u.id, u.email, u.display_name AS displayName, s.id AS sessionId
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > ?`,
  ).bind(await sha256(token), now).first<SessionUser & { sessionId: string }>();
  if (!row) return null;
  await env.DB.prepare("UPDATE sessions SET last_seen_at = ? WHERE id = ?").bind(now, row.sessionId).run();
  return { id: row.id, email: row.email, displayName: row.displayName };
}

export async function requireSessionUser() {
  const user = await getSessionUser();
  if (!user) throw new Response("Authentication required", { status: 401 });
  return user;
}

export async function revokeCurrentSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await env.DB.prepare("UPDATE sessions SET revoked_at = ? WHERE token_hash = ?").bind(Date.now(), await sha256(token)).run();
  store.delete(SESSION_COOKIE);
}

export async function revokeAllUserSessions(userId: string) {
  await env.DB.prepare("UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL").bind(Date.now(), userId).run();
}
