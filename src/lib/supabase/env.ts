/**
 * Centralised Supabase env access. When unset (or misconfigured with a Dashboard URL),
 * the app runs in "demo mode": the storefront serves typed mock data and admin shows
 * a setup banner instead of failing with HTML studio responses.
 */

let warnedDashboardUrl = false;

export function getSupabaseEnv(): { url: string; anonKey: string } | null {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!rawUrl || !anonKey) return null;

  const url = rawUrl.replace(/\/+$/, "");
  if (!/^https?:\/\//.test(url) || url.includes("xxxxxxxx")) return null;

  try {
    const parsed = new URL(url);
    if (parsed.hostname === "supabase.com" || parsed.pathname.startsWith("/dashboard")) {
      if (!warnedDashboardUrl) {
        warnedDashboardUrl = true;
        console.warn(
          "[supabase] NEXT_PUBLIC_SUPABASE_URL berisi URL Dashboard Supabase. Gunakan Project API URL (contoh: https://<project-ref>.supabase.co).",
        );
      }
      return null;
    }
  } catch {
    return null;
  }

  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv() !== null;
}
