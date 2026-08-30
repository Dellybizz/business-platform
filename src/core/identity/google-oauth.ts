import { env } from "cloudflare:workers";
import { sha256 } from "./crypto";

const GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

type GoogleEnvironment = typeof env & {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
};

type RuntimeGlobal = typeof globalThis & {
  __MODULO_RUNTIME_ENV__?: {
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
  };
};

export type GoogleProfile = {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
};

function credentials() {
  const runtime = env as GoogleEnvironment;
  const requestRuntime = (globalThis as RuntimeGlobal).__MODULO_RUNTIME_ENV__;
  // `cloudflare:workers` is the primary binding API. With nodejs_compat,
  // Cloudflare also exposes string and secret bindings through process.env;
  // that fallback covers Vinext child environments that do not inherit the
  // virtual env namespace correctly.
  const clientId = requestRuntime?.GOOGLE_CLIENT_ID || runtime.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = requestRuntime?.GOOGLE_CLIENT_SECRET || runtime.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Google login is not configured");
  }
  return { clientId, clientSecret };
}

export async function googleAuthorizationUrl(input: {
  origin: string;
  state: string;
  codeVerifier: string;
}) {
  const { clientId } = credentials();
  const url = new URL(GOOGLE_AUTHORIZE_URL);
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${input.origin}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state: input.state,
    code_challenge: await sha256(input.codeVerifier),
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  return url;
}

export async function exchangeGoogleCode(input: {
  origin: string;
  code: string;
  codeVerifier: string;
}): Promise<GoogleProfile> {
  const { clientId, clientSecret } = credentials();
  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: input.code,
      code_verifier: input.codeVerifier,
      grant_type: "authorization_code",
      redirect_uri: `${input.origin}/api/auth/google/callback`,
    }),
  });
  const token = await tokenResponse.json() as { access_token?: string };
  if (!tokenResponse.ok || !token.access_token) throw new Error("Google token exchange failed");

  const profileResponse = await fetch(GOOGLE_USERINFO_URL, {
    headers: { authorization: `Bearer ${token.access_token}` },
  });
  const profile = await profileResponse.json() as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
  };
  if (!profileResponse.ok || !profile.sub || !profile.email || profile.email_verified !== true) {
    throw new Error("Google did not return a verified email address");
  }
  return {
    sub: profile.sub,
    email: profile.email.trim().toLowerCase(),
    emailVerified: true,
    name: profile.name?.trim().slice(0, 80) || profile.email.split("@")[0],
  };
}
