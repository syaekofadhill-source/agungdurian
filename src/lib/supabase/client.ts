"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

/** Browser Supabase client (singleton). Used for direct-to-Storage image uploads in admin. */
export function createSupabaseBrowserClient() {
  const env = getSupabaseEnv();
  if (!env) return null;
  browserClient ??= createBrowserClient<Database>(env.url, env.anonKey);
  return browserClient;
}
