import "server-only";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Authorisation guard for admin Server Components & Server Actions.
 * The proxy already redirects anonymous visitors, but Server Actions are
 * public POST endpoints — so every mutation re-verifies the session here.
 */
export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase belum dikonfigurasi. Isi .env.local terlebih dahulu.");
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  return { supabase, user };
}
