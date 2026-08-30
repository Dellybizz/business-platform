import { cookies } from "next/headers";
import { env } from "cloudflare:workers";
import { createSession } from "@/src/core/identity/session";
import { exchangeGoogleCode } from "@/src/core/identity/google-oauth";
import { writeAuditEvent } from "@/src/core/audit/service";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const store = await cookies();
  const expectedState = store.get("modulo_google_state")?.value;
  const codeVerifier = store.get("modulo_google_verifier")?.value;
  const returnTo = safeReturnTo(store.get("modulo_google_return")?.value);
  clearOAuthCookies(store);

  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  if (requestUrl.searchParams.has("error")) return loginError(requestUrl, "cancelled");
  if (!code || !state || !expectedState || !codeVerifier || !constantTimeEqual(state, expectedState)) {
    return loginError(requestUrl, "invalid_state");
  }

  try {
    const profile = await exchangeGoogleCode({ origin: requestUrl.origin, code, codeVerifier });
    const now = Date.now();
    let user = await env.DB.prepare("SELECT id FROM users WHERE email = ?")
      .bind(profile.email).first<{ id: string }>();
    if (!user) {
      user = { id: crypto.randomUUID() };
      await env.DB.prepare(
        "INSERT INTO users (id, email, display_name, password_hash, email_verified_at, created_at) VALUES (?, ?, ?, NULL, ?, ?)",
      ).bind(user.id, profile.email, profile.name, now, now).run();
    } else {
      await env.DB.prepare(
        "UPDATE users SET email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?",
      ).bind(now, user.id).run();
    }
    await createSession(user.id);
    await writeAuditEvent({
      actorUserId: user.id,
      action: "session.google_created",
      targetType: "user",
      targetId: user.id,
      metadata: { googleSubject: profile.sub },
    });
    return Response.redirect(new URL(returnTo, requestUrl.origin), 303);
  } catch {
    return loginError(requestUrl, "failed");
  }
}

function clearOAuthCookies(store: Awaited<ReturnType<typeof cookies>>) {
  store.delete("modulo_google_state");
  store.delete("modulo_google_verifier");
  store.delete("modulo_google_return");
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

function safeReturnTo(value: string | undefined) {
  return value?.startsWith("/") && !value.startsWith("//") && !value.startsWith("/login")
    ? value
    : "/dashboard";
}

function loginError(requestUrl: URL, reason: string) {
  const target = new URL("/login", requestUrl.origin);
  target.searchParams.set("oauthError", reason);
  return Response.redirect(target, 303);
}
