"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import {
  productSchema,
  productToggleSchema,
  stockAdjustSchema,
  type ProductFormInput,
} from "@/lib/validations/product";
import type { ActionResult } from "@/types/actions";
import type { Product } from "@/types/database";

function revalidateStore(slug?: string) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/produk");
  if (slug) revalidatePath(`/produk/${slug}`);
}

function friendlyDbError(message: string, code?: string): string {
  if (code === "23505") return "Slug sudah dipakai produk lain. Gunakan slug yang berbeda.";
  if (code === "23514") return "Data melanggar aturan validasi database (cek harga, stok, & mode jual).";
  return message;
}

export async function saveProduct(
  input: ProductFormInput,
  productId?: string,
): Promise<ActionResult<{ id: string }>> {
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Data produk belum valid.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const { supabase } = await requireAdmin();

  if (productId) {
    if (!z.uuid().safeParse(productId).success) return { ok: false, error: "ID produk tidak valid." };
    const { data, error } = await supabase
      .from("products")
      .update(parsed.data)
      .eq("id", productId)
      .select("id, slug")
      .single();
    if (error) return { ok: false, error: friendlyDbError(error.message, error.code) };
    revalidateStore(data.slug);
    return { ok: true, message: "Produk berhasil diperbarui.", data: { id: data.id } };
  }

  const { data, error } = await supabase.from("products").insert(parsed.data).select("id, slug").single();
  if (error) return { ok: false, error: friendlyDbError(error.message, error.code) };
  revalidateStore(data.slug);
  return { ok: true, message: "Produk baru ditambahkan.", data: { id: data.id } };
}

export async function deleteProduct(productId: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(productId).success) return { ok: false, error: "ID produk tidak valid." };
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) return { ok: false, error: error.message };
  revalidateStore();
  return { ok: true, message: "Produk dihapus." };
}

export async function adjustStock(input: z.input<typeof stockAdjustSchema>): Promise<ActionResult<Product>> {
  const parsed = stockAdjustSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Permintaan stok tidak valid." };
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.rpc("adjust_product_stock", {
    p_product_id: parsed.data.productId,
    p_field: parsed.data.field,
    p_delta: parsed.data.delta,
  });
  if (error) return { ok: false, error: error.message };
  revalidateStore(data.slug);
  return { ok: true, data };
}

export async function toggleProductFlag(input: z.input<typeof productToggleSchema>): Promise<ActionResult> {
  const parsed = productToggleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Permintaan tidak valid." };
  const { supabase } = await requireAdmin();
  const payload =
    parsed.data.field === "is_active"
      ? { is_active: parsed.data.value }
      : { is_featured: parsed.data.value };
  const { data, error } = await supabase
    .from("products")
    .update(payload)
    .eq("id", parsed.data.productId)
    .select("slug")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidateStore(data.slug);
  return { ok: true };
}
