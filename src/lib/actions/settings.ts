"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import {
  storeContentSchema,
  storeGeneralPaymentSchema,
  storeMediaSchema,
  type StoreContentInput,
  type StoreGeneralPaymentInput,
  type StoreMediaInput,
} from "@/lib/validations/settings";
import type { ActionResult } from "@/types/actions";

function revalidateAllStorePaths() {
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/checkout");
  revalidatePath("/lacak");
  revalidatePath("/admin");
  revalidatePath("/admin/tampilan");
  revalidatePath("/admin/konten");
  revalidatePath("/admin/pengaturan");
}

export async function saveStoreMedia(input: StoreMediaInput): Promise<ActionResult> {
  const parsed = storeMediaSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Periksa kembali URL atau format gambar.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("store_settings").upsert({ id: 1, ...parsed.data });
  if (error) return { ok: false, error: error.message };

  revalidateAllStorePaths();
  return { ok: true, message: "Media & foto website diperbarui." };
}

export async function saveStoreContent(input: StoreContentInput): Promise<ActionResult> {
  const parsed = storeContentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Beberapa teks konten belum valid.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("store_settings").upsert({ id: 1, ...parsed.data });
  if (error) return { ok: false, error: error.message };

  revalidateAllStorePaths();
  return { ok: true, message: "Konten & copywriting toko langsung diperbarui." };
}

export async function saveStoreGeneralAndPayment(input: StoreGeneralPaymentInput): Promise<ActionResult> {
  const parsed = storeGeneralPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Beberapa pengaturan toko atau pembayaran belum valid.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("store_settings").upsert({ id: 1, ...parsed.data });
  if (error) return { ok: false, error: error.message };

  revalidateAllStorePaths();
  return { ok: true, message: "Pengaturan toko & metode pembayaran tersimpan." };
}
