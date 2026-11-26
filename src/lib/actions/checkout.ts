"use server";

import { randomInt } from "node:crypto";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  getActiveCustomOptions,
  getActiveDeliveryZones,
  getActiveProducts,
  getStoreSettings,
} from "@/lib/data/store";
import { MOCK_VOUCHERS } from "@/lib/mock-data";
import { butirUnitPrice, computeVoucherDiscount, gramUnitPrice } from "@/lib/pricing";
import { createSupabasePublicClient } from "@/lib/supabase/server";
import { formatRupiah } from "@/lib/utils";
import { checkoutSchema, type CheckoutInput } from "@/lib/validations/order";
import { buildOrderMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import type { ActionResult } from "@/types/actions";
import type {
  DeliveryZone,
  OrderAddonSnapshot,
  OrderItem,
  Product,
  PromoVoucher,
  PublicOrder,
  StatusHistoryEntry,
} from "@/types/database";

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

async function lookupActiveVoucher(code: string): Promise<PromoVoucher | null> {
  const clean = code.trim().toUpperCase();
  if (!clean) return null;

  const supabase = createSupabasePublicClient();
  if (!supabase) {
    return MOCK_VOUCHERS.find((v) => v.code.toUpperCase() === clean && v.is_active) ?? null;
  }

  const { data, error } = await supabase
    .from("promo_vouchers")
    .select("*")
    .eq("code", clean)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

function validateVoucherEligibility(
  voucher: PromoVoucher | null,
  subtotal: number,
): { ok: true; voucher: PromoVoucher; discount: number } | { ok: false; error: string } {
  if (!voucher) {
    return { ok: false, error: "Kode promo tidak ditemukan atau sudah tidak aktif." };
  }
  if (voucher.expires_at && new Date(voucher.expires_at).getTime() < Date.now()) {
    return { ok: false, error: `Kode promo ${voucher.code} sudah kedaluwarsa.` };
  }
  if (voucher.usage_limit !== null && voucher.used_count >= voucher.usage_limit) {
    return { ok: false, error: `Kuota promo ${voucher.code} sudah habis.` };
  }
  if (subtotal < voucher.min_subtotal) {
    return {
      ok: false,
      error: `Minimal belanja ${formatRupiah(voucher.min_subtotal)} untuk memakai promo ${voucher.code}.`,
    };
  }
  return {
    ok: true,
    voucher,
    discount: computeVoucherDiscount(voucher, subtotal),
  };
}

export async function validateVoucherAction(
  rawCode: string,
  subtotal: number,
): Promise<ActionResult<{ code: string; discountAmount: number; description: string }>> {
  const clean = rawCode.trim().toUpperCase();
  if (clean.length < 3) {
    return { ok: false, error: "Masukkan kode promo minimal 3 karakter." };
  }
  const voucher = await lookupActiveVoucher(clean);
  const check = validateVoucherEligibility(voucher, Math.max(0, Math.round(subtotal)));
  if (!check.ok) return { ok: false, error: check.error };

  return {
    ok: true,
    message: `Promo ${check.voucher.code} diterapkan! Hemat ${formatRupiah(check.discount)}.`,
    data: {
      code: check.voucher.code,
      discountAmount: check.discount,
      description: check.voucher.description,
    },
  };
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

  const [settings, products, customOptions, deliveryZones] = await Promise.all([
    getStoreSettings(),
    getActiveProducts(),
    getActiveCustomOptions(),
    getActiveDeliveryZones(),
  ]);

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
  const optionById = new Map(customOptions.map((o) => [o.id, o]));
  const grades = customOptions.filter((o) => o.option_type === "butir_grade");
  const preps = customOptions.filter((o) => o.option_type === "preparation");
  const packings = customOptions.filter((o) => o.option_type === "packing");
  const addonsCatalog = customOptions.filter((o) => o.option_type === "checkout_addon");

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
      const gradeOpt =
        (line.gradeId ? optionById.get(line.gradeId) : undefined) ??
        grades.find((g) => g.code === line.size);
      const prepOpt =
        (line.preparationId ? optionById.get(line.preparationId) : undefined) ??
        preps.find((p) => p.code === line.preparation);
      const packOpt = line.packingId ? optionById.get(line.packingId) : undefined;

      if (packOpt && packOpt.option_type !== "packing") {
        return { ok: false, error: "Opsi packing tidak valid." };
      }

      const prepExtra = prepOpt?.extra_price ?? 0;
      const packExtra = packOpt?.extra_price ?? 0;
      const unit = butirUnitPrice(product, gradeOpt ?? line.size, prepExtra, packExtra);

      butirDemand.set(product.id, (butirDemand.get(product.id) ?? 0) + line.quantity);
      items.push({
        mode: "butir",
        product_id: product.id,
        product_name: product.name,
        size: gradeOpt?.code ?? line.size,
        preparation: prepOpt?.code ?? line.preparation,
        grade_id: gradeOpt?.id ?? null,
        grade_name: gradeOpt?.name ?? null,
        grade_multiplier: gradeOpt?.price_multiplier ?? 1,
        preparation_id: prepOpt?.id ?? null,
        preparation_name: prepOpt?.name ?? null,
        preparation_price: prepExtra,
        packing_id: packOpt?.id ?? null,
        packing_name: packOpt?.name ?? null,
        packing_price: packExtra,
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

      const packOpt =
        (line.packingId ? optionById.get(line.packingId) : undefined) ??
        packings.find((p) => p.code === line.packaging);
      const packExtra = packOpt?.extra_price ?? 0;
      const unit = gramUnitPrice(product, line.grams, packOpt ? packExtra : line.packaging);

      gramDemand.set(product.id, (gramDemand.get(product.id) ?? 0) + line.grams * line.quantity);
      items.push({
        mode: "gram",
        product_id: product.id,
        product_name: product.name,
        grams: line.grams,
        packaging: packOpt?.code ?? line.packaging,
        packing_id: packOpt?.id ?? null,
        packing_name: packOpt?.name ?? null,
        packing_price: packExtra,
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

  // Server-recomputed Add-ons
  const addonsMap = new Map(addonsCatalog.map((a) => [a.id, a]));
  const selectedAddons: OrderAddonSnapshot[] = [];
  for (const aid of new Set(data.addonIds)) {
    const found = addonsMap.get(aid);
    if (found) {
      selectedAddons.push({ addon_id: found.id, name: found.name, price: found.extra_price });
    }
  }
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);

  // Server-recomputed Delivery Zone
  let zone: DeliveryZone | null = null;
  if (data.deliveryMethod !== "pickup" && data.deliveryZoneId) {
    zone = deliveryZones.find((z) => z.id === data.deliveryZoneId) ?? null;
    if (!zone) {
      return { ok: false, error: "Zona pengiriman yang dipilih sudah tidak aktif. Silakan pilih ulang." };
    }
    if (data.paymentMethod === "cod" && !zone.allow_cod) {
      return { ok: false, error: `COD tidak tersedia untuk zona ${zone.name}. Silakan pilih Transfer DANA.` };
    }
  }
  const shippingFee = zone ? zone.shipping_fee : 0;

  // Server-recomputed Subtotal & Voucher
  const subtotalAmount = items.reduce((sum, i) => sum + i.line_total, 0);
  let voucherCode: string | null = null;
  let discountAmount = 0;

  if (data.voucherCode) {
    const voucher = await lookupActiveVoucher(data.voucherCode);
    const check = validateVoucherEligibility(voucher, subtotalAmount);
    if (!check.ok) {
      return { ok: false, error: check.error };
    }
    voucherCode = check.voucher.code;
    discountAmount = check.discount;
  }

  const total = Math.max(0, subtotalAmount + addonsTotal + shippingFee - discountAmount);
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
        subtotal_amount: subtotalAmount,
        addons_json: selectedAddons,
        addons_total: addonsTotal,
        delivery_zone_id: zone?.id ?? null,
        delivery_zone_name: zone?.name ?? null,
        shipping_fee: shippingFee,
        voucher_code: voucherCode,
        discount_amount: discountAmount,
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

    if (voucherCode) {
      await supabase.rpc("increment_voucher_usage", { p_code: voucherCode });
    }

    revalidatePath("/admin");
    revalidatePath("/admin/pesanan");
    revalidatePath("/admin/kustomisasi");
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
    subtotalAmount,
    addons: selectedAddons,
    deliveryZoneName: zone?.name ?? null,
    shippingFee,
    voucherCode,
    discountAmount,
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
    subtotal_amount: subtotalAmount,
    addons_json: selectedAddons,
    addons_total: addonsTotal,
    delivery_zone_name: zone?.name ?? null,
    shipping_fee: shippingFee,
    voucher_code: voucherCode,
    discount_amount: discountAmount,
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
