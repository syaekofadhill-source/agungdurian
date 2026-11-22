"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validations/auth";
import type { ActionResult } from "@/types/actions";

export async function signIn(input: { email: string; password: string; next?: string }): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Periksa kembali email & kata sandi.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, error: "Supabase belum dikonfigurasi. Lihat SETUP_GUIDE.md untuk mengisi .env.local." };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) {
    return { ok: false, error: "Email atau kata sandi salah." };
  }

  redirect(parsed.data.next);
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();
  redirect("/admin/login");
}
