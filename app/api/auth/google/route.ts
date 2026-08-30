import { cookies } from "next/headers";
import { randomToken } from "@/src/core/identity/crypto";
import { googleAuthorizationUrl } from "@/src/core/identity/google-oauth";

const OAUTH_COOKIE_AGE = 10 * 60;

type OAuthStartStage = "request" | "cookies" | "authorization" | "redirect" | "credentials";

export async function GET(request: Request) {
  let stage: OAuthStartStage = "request";
  try {
    const requestUrl = new URL(request.url);
    const returnTo = safeReturnTo(requestUrl.searchParams.get("returnTo"));
    const state = randomToken(24);
    const codeVerifier = randomToken(48);

    stage = "cookies";
    const store = await cookies();
    const options = { httpOnly: true, sameSite: "lax" as const, secure: true, path: "/", maxAge: OAUTH_COOKIE_AGE };
    store.set("modulo_google_state", state, options);
    store.set("modulo_google_verifier", codeVerifier, options);
    store.set("modulo_google_return", returnTo, options);

    stage = "authorization";
    const authorizationUrl = await googleAuthorizationUrl({
      origin: requestUrl.origin,
      state,
      codeVerifier,
    });

    stage = "redirect";
    return Response.redirect(authorizationUrl, 302);
  } catch (error) {
    const diagnosticStage: OAuthStartStage =
      error instanceof Error && error.message === "Google login is not configured"
        ? "credentials"
        : stage;
    console.error("Google OAuth start failed", {
      stage: diagnosticStage,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    const target = new URL("/login", request.url);
    target.searchParams.set("oauthError", "configuration");
    target.searchParams.set("oauthStage", diagnosticStage);
    return Response.redirect(target, 303);
  }
}

function safeReturnTo(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") && !value.startsWith("/login")
    ? value
    : "/dashboard";
}
