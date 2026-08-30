import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./supabase-config";
let client: SupabaseClient | undefined;
export function getSupabaseBrowserClient() {
  if (client) return client;
  const config = getSupabaseConfig();
  client = createClient(config.url, config.publishableKey, { auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } });
  return client;
}
