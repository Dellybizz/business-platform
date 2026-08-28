import { env } from "cloudflare:workers";
import { createSession } from "@/src/core/identity/session";
import { hashSecret, randomToken, sha256 } from "@/src/core/identity/crypto";
import { writeAuditEvent } from "@/src/core/audit/service";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string; password?: string; displayName?: string };
    const email = body.email?.trim().toLowerCase() || "";
    const displayName = body.displayName?.trim().slice(0, 80) || "";
    if (!/^\S+@\S+\.\S+$/.test(email)) return Response.json({ error: "Enter a valid email address" }, { status: 400 });
    if (!displayName) return Response.json({ error: "Name is required" }, { status: 400 });
    if (!body.password || body.password.length < 10) return Response.json({ error: "Password must be at least 10 characters" }, { status: 400 });
    const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
    if (existing) return Response.json({ error: "An account with this email already exists" }, { status: 409 });
    const userId = crypto.randomUUID();
    const recoveryCode = randomToken(24);
    const now = Date.now();
    await env.DB.batch([
      env.DB.prepare(
        "INSERT INTO users (id, email, display_name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
      ).bind(userId, email, displayName, await hashSecret(body.password), now),
      env.DB.prepare(
        "INSERT INTO account_recovery_tokens (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)",
      ).bind(crypto.randomUUID(), userId, await sha256(recoveryCode), now + 365 * 24 * 60 * 60 * 1000, now),
    ]);
    await createSession(userId);
    await writeAuditEvent({ actorUserId: userId, action: "identity.registered", targetType: "user", targetId: userId });
    return Response.json({ ok: true, recoveryCode }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Registration failed" }, { status: 500 });
  }
}
