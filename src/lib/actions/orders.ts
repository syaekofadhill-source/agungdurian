"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import { orderStatusSchema } from "@/lib/validations/order";
import type { ActionResult } from "@/types/actions";
import type { Order } from "@/types/database";

/**
 * Transitions an order's status. Stock deduction/restoration happens inside the
 * `transition_order_status` PostgreSQL function, so status + stock change in ONE
 * transaction with row-level locks (no race conditions, no partial deductions).
 */
export async function updateOrderStatus(input: z.input<typeof orderStatusSchema>): Promise<ActionResult<Order>> {
  const parsed = orderStatusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Permintaan status tidak valid." };
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase.rpc("transition_order_status", {
    p_order_id: parsed.data.orderId,
    p_status: parsed.data.status,
    p_deduct: parsed.data.deductStock,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/pesanan");
  revalidatePath("/admin/produk");

  let stockNote = "";
  if (parsed.data.status === "cancelled" || parsed.data.status === "pending") {
    stockNote = " Stok yang sempat dipotong telah dikembalikan.";
  } else if (data.stock_deducted) {
    stockNote = " Stok tersinkron otomatis.";
  }
  return { ok: true, message: `Status pesanan diperbarui.${stockNote}`, data };
}

export async function deleteOrder(orderId: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(orderId).success) return { ok: false, error: "ID pesanan tidak valid." };
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("orders").delete().eq("id", orderId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  revalidatePath("/admin/pesanan");
  return { ok: true, message: "Pesanan dihapus." };
}
