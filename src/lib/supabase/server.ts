import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

/**
 * Server-side Supabase client bound to the request cookies (RSC, Server Actions, Route Handlers).
 * Returns `null` in demo mode so callers can fall back gracefully.
 */
export async function createSupabaseServerClient() {
  const env = getSupabaseEnv();
  if (!env) return null;

  const cookieStore = await cookies();

  return createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component — safe to ignore; the proxy refreshes sessions.
        }
      },
    },
  });
}

/**
 * Cookie-less anonymous client for public, cacheable reads (storefront data).
 * Uses the anon role, so RLS limits it to active products / visible testimonials.
 */
export function createSupabasePublicClient() {
  const env = getSupabaseEnv();
  if (!env) return null;
  return createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {},
    },
  });
}
