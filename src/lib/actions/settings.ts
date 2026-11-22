"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import { settingsSchema, type SettingsFormInput } from "@/lib/validations/settings";
import type { ActionResult } from "@/types/actions";

export async function saveSettings(input: SettingsFormInput): Promise<ActionResult> {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Beberapa isian belum valid.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("store_settings").upsert({ id: 1, ...parsed.data });
  if (error) return { ok: false, error: error.message };

  // Announcement bar, hero, marquee, footer & JSON-LD live in the shared layout.
  revalidatePath("/", "layout");
  return { ok: true, message: "Pengaturan tersimpan & langsung tampil di toko." };
}
