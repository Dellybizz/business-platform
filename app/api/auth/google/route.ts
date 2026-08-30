import { cookies } from "next/headers";
import { randomToken } from "@/src/core/identity/crypto";
import { googleAuthorizationUrl } from "@/src/core/identity/google-oauth";

const OAUTH_COOKIE_AGE = 10 * 60;

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const returnTo = safeReturnTo(requestUrl.searchParams.get("returnTo"));
    const state = randomToken(24);
    const codeVerifier = randomToken(48);
    const store = await cookies();
    const options = { httpOnly: true, sameSite: "lax" as const, secure: true, path: "/", maxAge: OAUTH_COOKIE_AGE };
    store.set("modulo_google_state", state, options);
    store.set("modulo_google_verifier", codeVerifier, options);
    store.set("modulo_google_return", returnTo, options);
    const authorizationUrl = await googleAuthorizationUrl({
      origin: requestUrl.origin,
      state,
      codeVerifier,
    });
    return Response.redirect(authorizationUrl, 302);
  } catch {
    return Response.redirect(new URL("/login?oauthError=configuration", request.url), 303);
  }
}

function safeReturnTo(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") && !value.startsWith("/login")
    ? value
    : "/dashboard";
}
