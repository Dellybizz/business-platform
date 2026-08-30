import { getSupabaseConfig } from "./supabase-config";

const PKCE_STORAGE_KEY = "modulo_supabase_pkce_verifier";

function base64Url(bytes: Uint8Array) {
  let value = "";
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function randomVerifier() {
  return base64Url(crypto.getRandomValues(new Uint8Array(48)));
}

async function challengeFor(verifier: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
}

export async function startSupabaseGoogleOAuth(redirectTo: string) {
  const config = getSupabaseConfig();
  const verifier = randomVerifier();
  sessionStorage.setItem(PKCE_STORAGE_KEY, verifier);

  const url = new URL("/auth/v1/authorize", config.url);
  url.searchParams.set("provider", "google");
  url.searchParams.set("redirect_to", redirectTo);
  url.searchParams.set("code_challenge", await challengeFor(verifier));
  url.searchParams.set("code_challenge_method", "s256");
  url.searchParams.set("prompt", "select_account");
  window.location.assign(url.toString());
}

export async function exchangeSupabaseCode(code: string) {
  const config = getSupabaseConfig();
  const verifier = sessionStorage.getItem(PKCE_STORAGE_KEY);
  if (!verifier) throw new Error("The sign-in verifier is missing. Please start Google sign-in again.");

  const response = await fetch(new URL("/auth/v1/token?grant_type=pkce", config.url), {
    method: "POST",
    headers: {
      apikey: config.publishableKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
  });
  const payload = await response.json() as {
    access_token?: string;
    error?: string;
    error_description?: string;
    message?: string;
  };
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || payload.message || payload.error || "Supabase did not return a session.");
  }
  sessionStorage.removeItem(PKCE_STORAGE_KEY);
  return { accessToken: payload.access_token };
}
