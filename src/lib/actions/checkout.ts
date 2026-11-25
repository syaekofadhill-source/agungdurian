"use server";

import { randomInt } from "node:crypto";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getActiveProducts, getStoreSettings } from "@/lib/data/store";
import { butirUnitPrice, gramUnitPrice } from "@/lib/pricing";
import { createSupabasePublicClient } from "@/lib/supabase/server";
import { checkoutSchema, type CheckoutInput } from "@/lib/validations/order";
import { buildOrderMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import type { ActionResult } from "@/types/actions";
import type { OrderItem, Product, PublicOrder, StatusHistoryEntry } from "@/types/database";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateOrderCode(now = new Date()): string {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(now)
    .replaceAll("-", "");
  let suffix = "";
  for (let i = 0; i < 4; i++) suffix += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return `AGD-${ymd}-${suffix}`;
}

export async function submitCheckout(
  input: CheckoutInput,
): Promise<
  ActionResult<{
    orderCode: string;
    whatsappUrl: string;
    demo: boolean;
    publicOrder: PublicOrder;
  }>
> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Mohon periksa kembali data pesanan Anda.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const data = parsed.data;

  const [settings, products] = await Promise.all([getStoreSettings(), getActiveProducts()]);

  if (data.paymentMethod === "dana" && !settings.payment_dana_enabled) {
    return { ok: false, error: "Pembayaran DANA sedang dinonaktifkan sementara oleh toko." };
  }
  if (data.paymentMethod === "cod" && !settings.payment_cod_enabled) {
    return { ok: false, error: "Pembayaran COD sedang dinonaktifkan sementara oleh toko." };
  }
  if (data.paymentMethod === "ambil_di_tempat" && !settings.payment_pickup_enabled) {
    return { ok: false, error: "Pembayaran di tempat sedang dinonaktifkan sementara oleh toko." };
  }

  const byId = new Map<string, Product>(products.map((p) => [p.id, p]));

  const items: OrderItem[] = [];
  const butirDemand = new Map<string, number>();
  const gramDemand = new Map<string, number>();

  for (const line of data.items) {
    const product = byId.get(line.productId);
    if (!product) {
      return { ok: false, error: "Salah satu produk di keranjang sudah tidak tersedia. Silakan perbarui keranjang." };
    }

    if (line.mode === "butir") {
      if (!product.allow_butir) {
        return { ok: false, error: `${product.name} saat ini tidak dijual per butir.` };
      }
      const unit = butirUnitPrice(product, line.size);
      butirDemand.set(product.id, (butirDemand.get(product.id) ?? 0) + line.quantity);
      items.push({
        mode: "butir",
        product_id: product.id,
        product_name: product.name,
        size: line.size,
        preparation: line.preparation,
        quantity: line.quantity,
        unit_price: unit,
        line_total: unit * line.quantity,
      });
    } else {
      if (!product.allow_gram) {
        return { ok: false, error: `${product.name} saat ini tidak dijual per gram.` };
      }
      if (line.grams < product.min_gram || line.grams > product.max_gram) {
        return {
          ok: false,
          error: `Gramasi ${product.name} harus antara ${product.min_gram}g – ${product.max_gram}g.`,
        };
      }
      const unit = gramUnitPrice(product, line.grams, line.packaging);
      gramDemand.set(product.id, (gramDemand.get(product.id) ?? 0) + line.grams * line.quantity);
      items.push({
        mode: "gram",
        product_id: product.id,
        product_name: product.name,
        grams: line.grams,
        packaging: line.packaging,
        quantity: line.quantity,
        unit_price: unit,
        line_total: unit * line.quantity,
      });
    }
  }

  for (const [id, qty] of butirDemand) {
    const p = byId.get(id);
    if (p && qty > p.stock_butir) {
      return { ok: false, error: `Stok ${p.name} tinggal ${p.stock_butir} butir. Kurangi jumlah pesanan Anda.` };
    }
  }
  for (const [id, grams] of gramDemand) {
    const p = byId.get(id);
    if (p && grams > p.stock_gram) {
      return { ok: false, error: `Stok daging ${p.name} tinggal ${p.stock_gram}g. Kurangi gramasi pesanan Anda.` };
    }
  }

  const total = items.reduce((sum, i) => sum + i.line_total, 0);
  const deliveryAddress = data.deliveryMethod === "pickup" ? null : data.deliveryAddress || null;
  const notes = data.notes || null;
  const nowIso = new Date().toISOString();
  const initialHistory: StatusHistoryEntry[] = [
    {
      status: "pending_approval",
      note: "Pesanan dibuat pembeli melalui halaman checkout.",
      timestamp: nowIso,
      actor: "customer",
    },
  ];

  const supabase = createSupabasePublicClient();
  let orderCode = generateOrderCode();

  if (supabase) {
    let saved = false;
    for (let attempt = 0; attempt < 4 && !saved; attempt++) {
      const { error } = await supabase.from("orders").insert({
        order_code: orderCode,
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        delivery_method: data.deliveryMethod,
        delivery_address: deliveryAddress,
        notes,
        items_json: items,
        total_amount: total,
        payment_method: data.paymentMethod,
        payment_status: "unpaid",
        approval_status: "pending_approval",
        status: "pending_approval",
        status_history_json: initialHistory,
      });
      if (!error) {
        saved = true;
      } else if (error.code === "23505") {
        orderCode = generateOrderCode();
      } else {
        console.error("[checkout] insert gagal:", error.message);
        return { ok: false, error: "Pesanan gagal dicatat. Silakan coba lagi sebentar lagi." };
      }
    }
    if (!saved) return { ok: false, error: "Gagal membuat kode pesanan unik. Silakan coba lagi." };
    revalidatePath("/admin");
    revalidatePath("/admin/pesanan");
  }

  const message = buildOrderMessage({
    storeName: settings.store_name,
    orderCode,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    deliveryMethod: data.deliveryMethod,
    paymentMethod: data.paymentMethod,
    deliveryAddress,
    notes,
    items,
    total,
  });

  const phone = data.customerPhone;
  const publicOrder: PublicOrder = {
    order_code: orderCode,
    customer_name: data.customerName,
    masked_phone: `${phone.slice(0, 5)}****${phone.slice(-3)}`,
    delivery_method: data.deliveryMethod,
    payment_method: data.paymentMethod,
    payment_status: "unpaid",
    payment_proof_url: null,
    approval_status: "pending_approval",
    status: "pending_approval",
    admin_note: null,
    items_json: items,
    total_amount: total,
    status_history_json: initialHistory,
    approved_at: null,
    created_at: nowIso,
  };

  return {
    ok: true,
    message: supabase
      ? "Pesanan berhasil dibuat & menunggu persetujuan admin."
      : "Mode pratinjau: pesanan dibuat secara lokal.",
    data: {
      orderCode,
      whatsappUrl: buildWhatsAppUrl(settings.whatsapp_number, message),
      demo: !supabase,
      publicOrder,
    },
  };
}
