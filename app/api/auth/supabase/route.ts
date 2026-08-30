import { createClient, type User } from "@supabase/supabase-js";
import { env } from "cloudflare:workers";
import { getSupabaseConfig } from "@/lib/auth/supabase-config";
import { createSession } from "@/src/core/identity/session";
import { writeAuditEvent } from "@/src/core/audit/service";
export async function POST(request: Request) {
  try {
    const body = await request.json() as { accessToken?: unknown };
    if (typeof body.accessToken !== "string" || body.accessToken.length < 20 || body.accessToken.length > 8192) return Response.json({ error: "A valid Supabase access token is required." }, { status: 400 });
    const config = getSupabaseConfig();
    const supabase = createClient(config.url, config.publishableKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
    const { data, error } = await supabase.auth.getUser(body.accessToken);
    if (error || !data.user) return Response.json({ error: "The Google session is invalid or expired." }, { status: 401 });
    const identity = verifiedGoogleIdentity(data.user);
    if (!identity) return Response.json({ error: "A verified Google email address is required." }, { status: 403 });
    const userId = await findOrCreateUser(identity);
    await createSession(userId);
    await writeAuditEvent({ actorUserId: userId, action: "session.supabase_google_created", targetType: "user", targetId: userId, metadata: { authProvider: "supabase", supabaseSubject: identity.subject } });
    return Response.json({ ok: true });
  } catch (error) {
    const configurationError = error instanceof Error && error.message.startsWith("Supabase");
    console.error("Supabase authentication failed", { errorName: error instanceof Error ? error.name : "UnknownError" });
    return Response.json({ error: configurationError ? "Supabase login has not been configured yet." : "Sign-in could not be completed." }, { status: configurationError ? 503 : 500 });
  }
}
function verifiedGoogleIdentity(user: User) {
  const providers = Array.isArray(user.app_metadata.providers) ? user.app_metadata.providers : [];
  if (!(user.app_metadata.provider === "google" || providers.includes("google")) || !user.email || !user.email_confirmed_at) return null;
  const email = user.email.trim().toLowerCase();
  const metadataName = typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : typeof user.user_metadata.name === "string" ? user.user_metadata.name : "";
  return { subject: user.id, email, displayName: metadataName.trim().slice(0, 80) || email.split("@")[0] };
}
async function findOrCreateUser(identity: { subject: string; email: string; displayName: string }) {
  const byIdentity = await env.DB.prepare("SELECT id FROM users WHERE auth_provider = 'supabase' AND auth_subject = ?").bind(identity.subject).first<{ id: string }>();
  if (byIdentity) return byIdentity.id;
  const byEmail = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(identity.email).first<{ id: string }>();
  const now = Date.now();
  if (byEmail) { await env.DB.prepare("UPDATE users SET auth_provider = 'supabase', auth_subject = ?, email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?").bind(identity.subject, now, byEmail.id).run(); return byEmail.id; }
  const id = crypto.randomUUID();
  try { await env.DB.prepare("INSERT INTO users (id, email, display_name, password_hash, email_verified_at, auth_provider, auth_subject, created_at) VALUES (?, ?, ?, NULL, ?, 'supabase', ?, ?)").bind(id, identity.email, identity.displayName, now, identity.subject, now).run(); return id; }
  catch { const raced = await env.DB.prepare("SELECT id FROM users WHERE email = ? OR (auth_provider = 'supabase' AND auth_subject = ?) LIMIT 1").bind(identity.email, identity.subject).first<{ id: string }>(); if (!raced) throw new Error("Unable to link Supabase identity"); return raced.id; }
}
