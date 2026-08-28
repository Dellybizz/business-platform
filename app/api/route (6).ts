import { env } from "cloudflare:workers";
import { hashSecret, randomToken, sha256 } from "@/src/core/identity/crypto";
import { createSession, revokeAllUserSessions } from "@/src/core/identity/session";
import { writeAuditEvent } from "@/src/core/audit/service";

export async function POST(request: Request) {
  const body = await request.json() as { email?: string; recoveryCode?: string; newPassword?: string };
  const email = body.email?.trim().toLowerCase() || "";
  if (!body.newPassword || body.newPassword.length < 10) return Response.json({ error: "New password must be at least 10 characters" }, { status: 400 });
  const user = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: string }>();
  if (!user || !body.recoveryCode) return Response.json({ error: "Recovery details are invalid" }, { status: 400 });
  const now = Date.now();
  const recovery = await env.DB.prepare(
    "SELECT id FROM account_recovery_tokens WHERE user_id = ? AND token_hash = ? AND used_at IS NULL AND expires_at > ?",
  ).bind(user.id, await sha256(body.recoveryCode), now).first<{ id: string }>();
  if (!recovery) return Response.json({ error: "Recovery details are invalid" }, { status: 400 });
  const nextRecoveryCode = randomToken(24);
  await env.DB.batch([
    env.DB.prepare("UPDATE users SET password_hash = ? WHERE id = ?").bind(await hashSecret(body.newPassword), user.id),
    env.DB.prepare("UPDATE account_recovery_tokens SET used_at = ? WHERE id = ?").bind(now, recovery.id),
    env.DB.prepare("INSERT INTO account_recovery_tokens (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind(crypto.randomUUID(), user.id, await sha256(nextRecoveryCode), now + 365 * 24 * 60 * 60 * 1000, now),
  ]);
  await revokeAllUserSessions(user.id);
  await createSession(user.id);
  await writeAuditEvent({ actorUserId: user.id, action: "identity.recovered", targetType: "user", targetId: user.id });
  return Response.json({ ok: true, recoveryCode: nextRecoveryCode });
}
