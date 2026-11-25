"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import { MOCK_ORDERS, toPublicOrder } from "@/lib/mock-data";
import { normalizeOrderRecord } from "@/lib/settings-helper";
import { createSupabasePublicClient } from "@/lib/supabase/server";
import { sanitizePhone } from "@/lib/utils";
import { orderActionSchema, trackOrderQuerySchema } from "@/lib/validations/order";
import type { ActionResult } from "@/types/actions";
import type { Order, PublicOrder } from "@/types/database";

/**
 * Executes an atomic admin approval, rejection, or fulfillment transition
 * via `process_order_action` RPC (deducts or restores stock inside one transaction).
 */
export async function processOrderAction(
  input: z.input<typeof orderActionSchema>,
): Promise<ActionResult<Order>> {
  const parsed = orderActionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Permintaan tidak valid.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const { supabase, user } = await requireAdmin();

  const { data, error } = await supabase.rpc("process_order_action", {
    p_order_id: parsed.data.orderId,
    p_action: parsed.data.action,
    p_admin_note: parsed.data.adminNote || null,
    p_actor: user.email ?? "admin",
    p_verify_payment: parsed.data.verifyPayment,
  });

  if (error) return { ok: false, error: error.message };

  const order = normalizeOrderRecord(data);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/pesanan");
  revalidatePath("/admin/produk");
  revalidatePath(`/order/${order.order_code}`);

  const messages: Record<typeof parsed.data.action, string> = {
    approve: "Pesanan disetujui & stok otomatis diamankan.",
    reject: "Pesanan ditolak & stok dikembalikan jika sempat dipotong.",
    preparing: "Pesanan ditandai sedang disiapkan.",
    ready_or_shipping: "Pesanan ditandai siap diambil / dalam pengantaran.",
    completed: "Pesanan ditandai selesai.",
    cancelled: "Pesanan dibatalkan & stok dikembalikan.",
  };

  return { ok: true, message: messages[parsed.data.action], data: order };
}

export async function deleteOrder(orderId: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(orderId).success) return { ok: false, error: "ID pesanan tidak valid." };
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("orders").delete().eq("id", orderId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  revalidatePath("/admin/pesanan");
  return { ok: true, message: "Catatan pesanan dihapus." };
}

export async function trackOrdersAction(rawQuery: string): Promise<ActionResult<PublicOrder[]>> {
  const parsed = trackOrderQuerySchema.safeParse(rawQuery);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Kata kunci tidak valid." };
  }

  const query = parsed.data;
  const supabase = createSupabasePublicClient();

  if (!supabase) {
    const upper = query.toUpperCase();
    const digits = sanitizePhone(query);
    const matches = MOCK_ORDERS.filter(
      (o) => o.order_code.toUpperCase() === upper || (digits.length >= 10 && o.customer_phone === digits),
    ).map(toPublicOrder);
    return { ok: true, data: matches };
  }

  const { data, error } = await supabase.rpc("track_orders_by_query", { p_query: query });
  if (error) return { ok: false, error: "Gagal melacak pesanan. Silakan coba lagi." };
  return { ok: true, data: Array.isArray(data) ? data : [] };
}
