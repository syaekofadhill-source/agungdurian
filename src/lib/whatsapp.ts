import {
  BUTIR_PREPARATION_LABEL,
  DELIVERY_METHOD_META,
  GRAM_PACKAGING_META,
} from "@/lib/constants";
import { getButirSize } from "@/lib/pricing";
import { formatGram, formatRupiah, sanitizePhone } from "@/lib/utils";
import type { DeliveryMethod, OrderItem } from "@/types/database";

export function buildWhatsAppUrl(phone: string, message?: string): string {
  const base = `https://wa.me/${sanitizePhone(phone)}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function describeOrderItem(item: OrderItem): { title: string; detail: string } {
  if (item.mode === "butir") {
    const size = getButirSize(item.size);
    return {
      title: `${item.product_name} — Per Butir (Utuh)`,
      detail: `Ukuran ${size.label} · ${BUTIR_PREPARATION_LABEL[item.preparation]}`,
    };
  }
  return {
    title: `${item.product_name} — Per Gram (Kupas)`,
    detail: `${formatGram(item.grams)} · ${GRAM_PACKAGING_META[item.packaging].label}`,
  };
}

export function buildOrderMessage(params: {
  storeName: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  deliveryMethod: DeliveryMethod;
  deliveryAddress?: string | null;
  notes?: string | null;
  items: OrderItem[];
  total: number;
}): string {
  const lines: string[] = [];
  lines.push(`Halo ${params.storeName}, saya ingin memesan durian 🙏`);
  lines.push("");
  lines.push(`🧾 *Kode Pesanan:* ${params.orderCode}`);
  lines.push(`👤 Nama: ${params.customerName}`);
  lines.push(`📱 No. HP: +${params.customerPhone}`);
  lines.push(`🚚 Metode: ${DELIVERY_METHOD_META[params.deliveryMethod].label}`);
  if (params.deliveryAddress) lines.push(`📍 Alamat: ${params.deliveryAddress}`);
  lines.push("");
  lines.push("*RINCIAN PESANAN*");
  params.items.forEach((item, i) => {
    const { title, detail } = describeOrderItem(item);
    lines.push(`${i + 1}. ${title}`);
    lines.push(`   ${detail}`);
    lines.push(`   ${item.quantity} × ${formatRupiah(item.unit_price)} = *${formatRupiah(item.line_total)}*`);
  });
  lines.push("");
  lines.push(`💰 *Subtotal: ${formatRupiah(params.total)}*`);
  if (params.deliveryMethod !== "pickup") lines.push("_(Ongkir menyusul, dikonfirmasi admin)_");
  if (params.notes) {
    lines.push("");
    lines.push(`📝 Catatan: ${params.notes}`);
  }
  lines.push("");
  lines.push("Mohon konfirmasi ketersediaan & total pembayarannya ya. Terima kasih!");
  return lines.join("\n");
}
