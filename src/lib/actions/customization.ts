"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import {
  customOptionSchema,
  deliveryZoneSchema,
  gramPresetsSchema,
  promoVoucherSchema,
  type CustomOptionInput,
  type DeliveryZoneInput,
  type PromoVoucherInput,
} from "@/lib/validations/customization";
import type { ActionResult } from "@/types/actions";

function revalidateCustomization() {
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/checkout");
  revalidatePath("/admin/kustomisasi");
  revalidatePath("/admin/produk");
}

function dbErr(message: string, code?: string): string {
  if (code === "23505") return "Kode sudah digunakan. Gunakan kode lain.";
  return message;
}

export async function saveCustomOption(
  input: CustomOptionInput,
  id?: string,
): Promise<ActionResult> {
  const parsed = customOptionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Periksa kembali isian opsi.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const { supabase } = await requireAdmin();

  if (parsed.data.is_default) {
    await supabase
      .from("custom_options")
      .update({ is_default: false })
      .eq("option_type", parsed.data.option_type);
  }

  if (id) {
    if (!z.uuid().safeParse(id).success) return { ok: false, error: "ID opsi tidak valid." };
    const { error } = await supabase.from("custom_options").update(parsed.data).eq("id", id);
    if (error) return { ok: false, error: dbErr(error.message, error.code) };
    revalidateCustomization();
    return { ok: true, message: "Opsi diperbarui." };
  }

  const { error } = await supabase.from("custom_options").insert(parsed.data);
  if (error) return { ok: false, error: dbErr(error.message, error.code) };
  revalidateCustomization();
  return { ok: true, message: "Opsi baru ditambahkan." };
}

export async function toggleCustomOption(id: string, isActive: boolean): Promise<ActionResult> {
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "ID opsi tidak valid." };
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("custom_options").update({ is_active: isActive }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateCustomization();
  return { ok: true };
}

export async function deleteCustomOption(id: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "ID opsi tidak valid." };
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("custom_options").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateCustomization();
  return { ok: true, message: "Opsi dihapus." };
}

export async function saveDeliveryZone(input: DeliveryZoneInput, id?: string): Promise<ActionResult> {
  const parsed = deliveryZoneSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Periksa kembali data zona ongkir.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const { supabase } = await requireAdmin();

  if (id) {
    if (!z.uuid().safeParse(id).success) return { ok: false, error: "ID zona tidak valid." };
    const { error } = await supabase.from("delivery_zones").update(parsed.data).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidateCustomization();
    return { ok: true, message: "Zona ongkir diperbarui." };
  }

  const { error } = await supabase.from("delivery_zones").insert(parsed.data);
  if (error) return { ok: false, error: error.message };
  revalidateCustomization();
  return { ok: true, message: "Zona ongkir ditambahkan." };
}

export async function toggleDeliveryZone(id: string, isActive: boolean): Promise<ActionResult> {
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "ID zona tidak valid." };
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("delivery_zones").update({ is_active: isActive }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateCustomization();
  return { ok: true };
}

export async function deleteDeliveryZone(id: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "ID zona tidak valid." };
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("delivery_zones").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateCustomization();
  return { ok: true, message: "Zona ongkir dihapus." };
}

export async function savePromoVoucher(input: PromoVoucherInput, id?: string): Promise<ActionResult> {
  const parsed = promoVoucherSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Periksa kembali data kode promo.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const { supabase } = await requireAdmin();

  if (id) {
    if (!z.uuid().safeParse(id).success) return { ok: false, error: "ID voucher tidak valid." };
    const { error } = await supabase.from("promo_vouchers").update(parsed.data).eq("id", id);
    if (error) return { ok: false, error: dbErr(error.message, error.code) };
    revalidateCustomization();
    return { ok: true, message: "Voucher promo diperbarui." };
  }

  const { error } = await supabase.from("promo_vouchers").insert(parsed.data);
  if (error) return { ok: false, error: dbErr(error.message, error.code) };
  revalidateCustomization();
  return { ok: true, message: "Voucher promo ditambahkan." };
}

export async function togglePromoVoucher(id: string, isActive: boolean): Promise<ActionResult> {
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "ID voucher tidak valid." };
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("promo_vouchers").update({ is_active: isActive }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateCustomization();
  return { ok: true };
}

export async function deletePromoVoucher(id: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "ID voucher tidak valid." };
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("promo_vouchers").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateCustomization();
  return { ok: true, message: "Voucher promo dihapus." };
}

export async function saveGramPresets(presets: number[]): Promise<ActionResult> {
  const parsed = gramPresetsSchema.safeParse(presets);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Preset gramasi tidak valid." };
  }
  const uniqueSorted = [...new Set(parsed.data)].sort((a, b) => a - b);
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("store_settings")
    .upsert({ id: 1, gram_presets_json: uniqueSorted });
  if (error) return { ok: false, error: error.message };
  revalidateCustomization();
  return { ok: true, message: "Preset gramasi cepat diperbarui." };
}
