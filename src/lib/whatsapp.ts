import {
  BUTIR_PREPARATION_LABEL,
  DELIVERY_METHOD_META,
  GRAM_PACKAGING_META,
  ORDER_STATUS_META,
  PAYMENT_METHOD_META,
} from "@/lib/constants";
import { getButirSize } from "@/lib/pricing";
import { formatGram, formatRupiah, getSiteUrl, sanitizePhone } from "@/lib/utils";
import type { DeliveryMethod, OrderItem, OrderStatus, PaymentMethod } from "@/types/database";

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
  customerPhone?: string | null;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  deliveryAddress?: string | null;
  notes?: string | null;
  items: OrderItem[];
  total: number;
  hasProof?: boolean;
}): string {
  const lines: string[] = [];
  const invoiceUrl = `${getSiteUrl()}/order/${params.orderCode}`;
  lines.push(`Halo ${params.storeName}, saya sudah membuat pesanan durian 🙏`);
  lines.push("");
  lines.push(`🧾 *Kode Pesanan:* ${params.orderCode}`);
  lines.push(`👤 Nama: ${params.customerName}`);
  if (params.customerPhone) lines.push(`📱 No. HP: +${params.customerPhone}`);
  lines.push(`🚚 Pengambilan: ${DELIVERY_METHOD_META[params.deliveryMethod].label}`);
  lines.push(`💳 Pembayaran: ${PAYMENT_METHOD_META[params.paymentMethod].label}`);
  if (params.paymentMethod === "dana") {
    lines.push(params.hasProof ? `✅ Bukti transfer DANA sudah diunggah di invoice.` : `⏳ Pembayaran DANA menyusul di halaman invoice.`);
  }
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
  lines.push(`🔗 Cek Invoice & Status: ${invoiceUrl}`);
  lines.push("Mohon persetujuan & konfirmasinya ya. Terima kasih!");
  return lines.join("\n");
}

export function buildCustomerStatusMessage(params: {
  storeName: string;
  orderCode: string;
  customerName: string;
  status: OrderStatus;
  adminNote?: string | null;
}): string {
  const invoiceUrl = `${getSiteUrl()}/order/${params.orderCode}`;
  const statusLabel = ORDER_STATUS_META[params.status].label;
  const lines = [
    `Halo Kak ${params.customerName}, ini update pesanan *${params.orderCode}* dari *${params.storeName}* 🍈`,
    "",
    `📌 *Status Terbaru:* ${statusLabel}`,
  ];
  if (params.adminNote) lines.push(`📝 Catatan Admin: ${params.adminNote}`);
  lines.push(`🔗 Detail Pesanan: ${invoiceUrl}`);
  lines.push("");
  lines.push("Terima kasih sudah memesan di kebun kami!");
  return lines.join("\n");
}
