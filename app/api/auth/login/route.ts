import { env } from "cloudflare:workers";
import { verifySecret } from "@/src/core/identity/crypto";
import { createSession } from "@/src/core/identity/session";
import { writeAuditEvent } from "@/src/core/audit/service";

export async function POST(request: Request) {
  const body = await request.json() as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase() || "";
  const user = await env.DB.prepare(
    "SELECT id, password_hash AS passwordHash FROM users WHERE email = ?",
  ).bind(email).first<{ id: string; passwordHash: string | null }>();
  if (!user?.passwordHash || !body.password || !await verifySecret(body.password, user.passwordHash)) {
    return Response.json({ error: "Email or password is incorrect" }, { status: 401 });
  }
  await createSession(user.id);
  await writeAuditEvent({ actorUserId: user.id, action: "session.created", targetType: "user", targetId: user.id });
  return Response.json({ ok: true });
}
