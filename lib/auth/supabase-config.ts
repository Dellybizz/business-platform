const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || "";
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || "";
export function getSupabaseConfig() {
  if (!supabaseUrl || !supabasePublishableKey) throw new Error("Supabase login is not configured");
  let url: URL;
  try { url = new URL(supabaseUrl); } catch { throw new Error("Supabase URL is invalid"); }
  if (url.protocol !== "https:") throw new Error("Supabase URL must use HTTPS");
  return { url: url.origin, publishableKey: supabasePublishableKey };
}
