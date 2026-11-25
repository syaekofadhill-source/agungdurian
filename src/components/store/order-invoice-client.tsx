"use client";

import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  MessageCircle,
  Search,
  Upload,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { toast } from "sonner";

import { ProductImage } from "@/components/store/product-image";
import {
  APPROVAL_STATUS_META,
  DELIVERY_METHOD_META,
  ORDER_STATUS_META,
  PAYMENT_METHOD_META,
  PAYMENT_STATUS_META,
} from "@/lib/constants";
import { cn, formatDateTime, formatRupiah } from "@/lib/utils";
import { buildOrderMessage, buildWhatsAppUrl, describeOrderItem } from "@/lib/whatsapp";
import type { PublicOrder, StoreSettings } from "@/types/database";

const emptySubscribe = () => () => {};

function useDemoOrderFallback(orderCode: string, enabled: boolean): PublicOrder | null {
  const raw = useSyncExternalStore(
    emptySubscribe,
    () => {
      if (!enabled) return null;
      try {
        return sessionStorage.getItem(`agungdurian-demo-order-${orderCode}`);
      } catch {
        return null;
      }
    },
    () => null,
  );

  if (!raw) return null;
  try {
    return JSON.parse(raw) as PublicOrder;
  } catch {
    return null;
  }
}

export function OrderInvoiceClient({
  initialOrder,
  orderCode,
  settings,
}: {
  initialOrder: PublicOrder | null;
  orderCode: string;
  settings: StoreSettings;
}) {
  const router = useRouter();
  const demoFallback = useDemoOrderFallback(orderCode, initialOrder === null);
  const [updatedOrder, setUpdatedOrder] = useState<PublicOrder | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedDana, setCopiedDana] = useState(false);
  const [uploading, setUploading] = useState(false);

  const order = updatedOrder ?? initialOrder ?? demoFallback;

  if (!order) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-crimson/10 text-crimson">
          <AlertTriangle className="size-6" />
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold text-orchard">Invoice tidak ditemukan</h1>
        <p className="mt-2 text-sm text-moss">
          Kode pesanan <span className="font-mono font-bold text-orchard">{orderCode}</span> tidak ditemukan di sistem.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/lacak"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-gold px-6 text-sm font-bold text-orchard hover:bg-gold-hover"
          >
            <Search className="size-4" />
            Lacak dengan Nomor HP
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-full border border-orchard/15 px-6 text-sm font-semibold text-orchard hover:bg-cream-2"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  const statusMeta = ORDER_STATUS_META[order.status];
  const approvalMeta = APPROVAL_STATUS_META[order.approval_status];
  const paymentMeta = PAYMENT_METHOD_META[order.payment_method];
  const payStatusMeta = PAYMENT_STATUS_META[order.payment_status];

  const waMessage = buildOrderMessage({
    storeName: settings.store_name,
    orderCode: order.order_code,
    customerName: order.customer_name,
    deliveryMethod: order.delivery_method,
    paymentMethod: order.payment_method,
    items: order.items_json,
    total: order.total_amount,
    hasProof: Boolean(order.payment_proof_url),
  });

  async function copyText(text: string, which: "code" | "dana") {
    try {
      await navigator.clipboard.writeText(text);
      if (which === "code") {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        setCopiedDana(true);
        setTimeout(() => setCopiedDana(false), 2000);
      }
      toast.success("Berhasil disalin");
    } catch {
      toast.error("Tidak dapat menyalin otomatis");
    }
  }

  async function handleProofUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !order) return;

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("orderCode", order.order_code);
      fd.append("file", file);

      const res = await fetch("/api/orders/upload-proof", { method: "POST", body: fd });
      const json = (await res.json()) as {
        ok: boolean;
        proofUrl?: string;
        order?: PublicOrder;
        error?: string;
      };

      if (!json.ok) {
        toast.error(json.error ?? "Gagal mengunggah bukti transfer.");
        return;
      }

      if (json.order) {
        setUpdatedOrder(json.order);
      } else if (json.proofUrl) {
        setUpdatedOrder({
          ...order,
          payment_proof_url: json.proofUrl,
          payment_status: "waiting_verification",
        });
      }
      toast.success("Bukti transfer berhasil diunggah!");
      router.refresh();
    } finally {
      setUploading(false);
    }
  }

  const canUploadProof =
    order.payment_method === "dana" && order.status !== "completed" && order.status !== "cancelled";

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6 sm:py-14">
      <div
        className={cn(
          "rounded-3xl border p-6 shadow-soft",
          order.status === "rejected"
            ? "border-crimson/30 bg-crimson/[0.06]"
            : order.status === "pending_approval"
              ? "border-gold/40 bg-custard/55"
              : "border-emerald-700/25 bg-emerald-700/[0.06]",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <span
              className={cn(
                "grid size-11 shrink-0 place-items-center rounded-2xl",
                order.status === "rejected"
                  ? "bg-crimson text-white"
                  : order.status === "pending_approval"
                    ? "bg-gold text-orchard"
                    : "bg-orchard text-gold",
              )}
            >
              {order.status === "rejected" ? (
                <XCircle className="size-6" />
              ) : order.status === "pending_approval" ? (
                <Clock className="size-6" />
              ) : (
                <CheckCircle2 className="size-6" />
              )}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("rounded-full px-3 py-0.5 text-xs font-bold ring-1", statusMeta.className)}>
                  {statusMeta.label}
                </span>
                <span className={cn("rounded-full px-3 py-0.5 text-xs font-semibold ring-1", approvalMeta.className)}>
                  {approvalMeta.label}
                </span>
              </div>
              <h1 className="mt-2 font-display text-2xl font-bold text-orchard sm:text-3xl">
                {order.status === "pending_approval"
                  ? "Menunggu Persetujuan Admin Kebun"
                  : order.status === "rejected"
                    ? "Pesanan Ditolak oleh Admin"
                    : order.status === "completed"
                      ? "Pesanan Selesai — Selamat Menikmati!"
                      : "Pesanan Disetujui & Diproses"}
              </h1>
              <p className="mt-1 text-sm text-moss">
                {order.status === "pending_approval"
                  ? "Tim AgungDurian sedang memeriksa ketersediaan buah dan pembayaran Anda."
                  : order.status === "rejected"
                    ? "Mohon maaf, pesanan belum dapat kami proses. Lihat alasan admin di bawah ini."
                    : "Stok durian Anda sudah diamankan. Pantau status terbaru di halaman ini atau lacak kapan saja."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => copyText(order.order_code, "code")}
            className="inline-flex items-center gap-2 rounded-2xl border border-orchard/15 bg-white px-4 py-2.5 shadow-soft transition hover:border-gold"
          >
            <span className="font-mono text-sm font-bold text-orchard tabular">{order.order_code}</span>
            {copiedCode ? <Check className="size-4 text-emerald-700" /> : <Copy className="size-4 text-moss" />}
          </button>
        </div>

        {order.admin_note ? (
          <div className="mt-4 rounded-2xl border border-orchard/15 bg-white/85 px-4 py-3 text-xs">
            <span className="font-bold uppercase tracking-wider text-orchard">Catatan Admin: </span>
            <span className="text-bark">{order.admin_note}</span>
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        <div className="space-y-6 md:col-span-7">
          <div className="rounded-3xl border border-orchard/10 bg-white/85 p-6 shadow-soft">
            <h2 className="font-display text-lg font-bold text-orchard">Rincian Item</h2>
            <ul className="mt-4 divide-y divide-orchard/10">
              {order.items_json.map((item, idx) => {
                const desc = describeOrderItem(item);
                return (
                  <li key={idx} className="flex items-start justify-between gap-3 py-3 text-sm">
                    <div>
                      <p className="font-semibold text-orchard">{desc.title}</p>
                      <p className="text-xs text-moss">{desc.detail}</p>
                      <p className="mt-0.5 font-mono text-xs text-moss tabular">
                        {item.quantity} × {formatRupiah(item.unit_price)}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-orchard tabular">{formatRupiah(item.line_total)}</span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 flex items-baseline justify-between border-t border-orchard/10 pt-4">
              <span className="text-sm font-semibold text-moss">Total Pembayaran</span>
              <span className="font-mono text-2xl font-bold text-orchard tabular">
                {formatRupiah(order.total_amount)}
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-orchard/10 bg-white/85 p-6 shadow-soft">
            <h2 className="font-display text-lg font-bold text-orchard">Riwayat Status Pesanan</h2>
            <ol className="mt-4 space-y-4">
              {[...order.status_history_json].reverse().map((h, i) => (
                <li key={i} className="flex gap-3 text-xs">
                  <span className="mt-1 size-2.5 shrink-0 rounded-full bg-gold ring-4 ring-gold/20" />
                  <div>
                    <p className="font-semibold text-orchard">{h.note}</p>
                    <p className="mt-0.5 text-moss">
                      {ORDER_STATUS_META[h.status]?.label ?? h.status} · {formatDateTime(h.timestamp)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="space-y-6 md:col-span-5">
          <div className="space-y-4 rounded-3xl border border-orchard/10 bg-white/85 p-6 shadow-soft">
            <h2 className="font-display text-lg font-bold text-orchard">Info Pembayaran &amp; Ambil</h2>

            <dl className="space-y-2.5 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-moss">Pemesan</dt>
                <dd className="font-semibold text-bark">{order.customer_name}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-moss">Telepon</dt>
                <dd className="font-mono text-bark tabular">{order.masked_phone}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-moss">Pengambilan</dt>
                <dd className="font-semibold text-orchard">{DELIVERY_METHOD_META[order.delivery_method].label}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-moss">Metode Bayar</dt>
                <dd className={cn("rounded-full px-2.5 py-0.5 font-semibold ring-1", paymentMeta.badgeClass)}>
                  {paymentMeta.label}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-moss">Status Bayar</dt>
                <dd className={cn("rounded-full px-2.5 py-0.5 font-semibold ring-1", payStatusMeta.className)}>
                  {payStatusMeta.label}
                </dd>
              </div>
            </dl>

            {order.payment_method === "dana" ? (
              <div className="space-y-3 rounded-2xl border border-orchard/10 bg-cream-2/60 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-moss">
                      DANA ({settings.payment_dana_holder})
                    </p>
                    <p className="font-mono text-base font-bold text-orchard tabular">
                      {settings.payment_dana_number}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText(settings.payment_dana_number, "dana")}
                    className="inline-flex h-8 items-center gap-1 rounded-full bg-white px-3 text-xs font-semibold text-orchard shadow-soft hover:bg-gold"
                  >
                    {copiedDana ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                    Salin
                  </button>
                </div>

                {settings.dana_qr_image_url ? (
                  <div className="relative mx-auto size-36 overflow-hidden rounded-2xl border border-orchard/10 bg-white">
                    <ProductImage src={settings.dana_qr_image_url} alt="QR DANA" fill sizes="144px" />
                  </div>
                ) : null}

                {order.payment_proof_url ? (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-orchard">Bukti Transfer Terunggah:</p>
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-orchard/10 bg-orchard">
                      <ProductImage src={order.payment_proof_url} alt="Bukti transfer DANA" fill sizes="320px" />
                    </div>
                  </div>
                ) : null}

                {canUploadProof ? (
                  <label className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-orchard text-xs font-semibold text-cream transition hover:bg-orchard-2">
                    <Upload className="size-3.5 text-gold" />
                    <span>
                      {uploading
                        ? "Mengunggah Bukti…"
                        : order.payment_proof_url
                          ? "Ganti Bukti Transfer"
                          : "Unggah Bukti Transfer DANA"}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleProofUpload}
                      disabled={uploading}
                      className="sr-only"
                    />
                  </label>
                ) : null}
              </div>
            ) : null}

            <a
              href={buildWhatsAppUrl(settings.whatsapp_number, waMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gold text-sm font-bold text-orchard shadow-soft transition hover:bg-gold-hover"
            >
              <MessageCircle className="size-4" />
              Kirim Konfirmasi ke WhatsApp Admin
            </a>

            <Link
              href="/lacak"
              className="flex h-10 w-full items-center justify-center rounded-full border border-orchard/15 text-xs font-semibold text-orchard hover:bg-cream-2"
            >
              Lacak Pesanan Lain
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
