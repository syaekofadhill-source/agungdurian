"use client";

import {
  CheckCircle2,
  Maximize2,
  MessageCircle,
  PackageCheck,
  Trash2,
  Truck,
  XCircle,
} from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { ProductImage } from "@/components/store/product-image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { deleteOrder, processOrderAction } from "@/lib/actions/orders";
import {
  APPROVAL_STATUS_META,
  DELIVERY_METHOD_META,
  ORDER_STATUS_META,
  PAYMENT_METHOD_META,
  PAYMENT_STATUS_META,
} from "@/lib/constants";
import { cn, formatDateTime, formatRupiah, prettyPhone } from "@/lib/utils";
import { buildCustomerStatusMessage, buildWhatsAppUrl, describeOrderItem } from "@/lib/whatsapp";
import type { Order, OrderAdminAction } from "@/types/database";

export function OrderDetailModal({
  order,
  storeName,
  configured,
  onClose,
}: {
  order: Order | null;
  storeName: string;
  configured: boolean;
  onClose: () => void;
}) {
  const [verifyPayment, setVerifyPayment] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<OrderAdminAction | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!order) return null;
  const activeOrder = order;

  function runAction(action: OrderAdminAction, adminNote: string) {
    if (!configured) {
      toast.info("Mode pratinjau: hubungkan Supabase untuk memproses approval & stok.");
      setPendingAction(null);
      return;
    }

    startTransition(async () => {
      const res = await processOrderAction({
        orderId: activeOrder.id,
        action,
        adminNote,
        verifyPayment,
      });

      if (!res.ok) {
        toast.error(res.error);
        return;
      }

      toast.success(res.message ?? "Status pesanan diperbarui.");
      setPendingAction(null);
    });
  }

  function handleDirectAction(action: OrderAdminAction) {
    if (action === "approve" || action === "reject" || action === "cancelled") {
      setPendingAction(action);
      return;
    }
    runAction(action, "");
  }

  function handleDelete() {
    if (!configured) {
      toast.info("Mode pratinjau: hubungkan Supabase untuk menghapus pesanan.");
      setConfirmDeleteOpen(false);
      return;
    }
    startTransition(async () => {
      const res = await deleteOrder(activeOrder.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message ?? "Pesanan dihapus.");
      setConfirmDeleteOpen(false);
      onClose();
    });
  }

  const statusMeta = ORDER_STATUS_META[order.status];
  const approvalMeta = APPROVAL_STATUS_META[order.approval_status];
  const payMethodMeta = PAYMENT_METHOD_META[order.payment_method];
  const payStatusMeta = PAYMENT_STATUS_META[order.payment_status];

  const waUpdateUrl = buildWhatsAppUrl(
    order.customer_phone,
    buildCustomerStatusMessage({
      storeName,
      orderCode: order.order_code,
      customerName: order.customer_name,
      status: order.status,
      adminNote: order.admin_note,
    }),
  );

  const canApprove = order.status === "pending_approval" || order.status === "rejected";
  const canReject = order.status !== "rejected" && order.status !== "completed" && order.status !== "cancelled";

  return (
    <>
      <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
        <DialogContent className="max-w-2xl p-6">
          <div className="space-y-5">
            <div className="pr-8">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="font-mono text-lg font-bold text-orchard tabular">
                  {order.order_code}
                </DialogTitle>
                <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1", statusMeta.className)}>
                  {statusMeta.label}
                </span>
                <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1", approvalMeta.className)}>
                  {approvalMeta.label}
                </span>
              </div>
              <DialogDescription className="mt-1 text-xs text-moss">
                Masuk {formatDateTime(order.created_at)}
                {order.approved_at ? ` · Disetujui ${formatDateTime(order.approved_at)}` : ""}
              </DialogDescription>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 rounded-2xl border border-orchard/10 bg-cream-2/60 p-4 text-xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-moss">Pembeli &amp; Pengambilan</p>
                <p className="text-sm font-bold text-orchard">{order.customer_name}</p>
                <p className="font-mono text-moss tabular">{prettyPhone(order.customer_phone)}</p>
                <p className="pt-1 font-semibold text-bark">
                  {DELIVERY_METHOD_META[order.delivery_method].label}
                  {order.delivery_zone_name ? ` · ${order.delivery_zone_name}` : ""}
                </p>
                {order.delivery_address ? <p className="text-moss">{order.delivery_address}</p> : null}
                {order.notes ? <p className="text-moss">Catatan pembeli: {order.notes}</p> : null}
              </div>

              <div className="space-y-2 rounded-2xl border border-orchard/10 bg-cream-2/60 p-4 text-xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-moss">Pembayaran</p>
                <div className="flex flex-wrap gap-1.5">
                  <span className={cn("rounded-full px-2.5 py-0.5 font-semibold ring-1", payMethodMeta.badgeClass)}>
                    {payMethodMeta.label}
                  </span>
                  <span className={cn("rounded-full px-2.5 py-0.5 font-semibold ring-1", payStatusMeta.className)}>
                    {payStatusMeta.label}
                  </span>
                </div>

                {order.payment_method === "dana" ? (
                  order.payment_proof_url ? (
                    <button
                      type="button"
                      onClick={() => setLightboxOpen(true)}
                      className="group relative mt-2 block aspect-[16/9] w-full overflow-hidden rounded-xl border border-orchard/15 bg-orchard"
                    >
                      <ProductImage src={order.payment_proof_url} alt="Bukti Transfer DANA" fill sizes="280px" />
                      <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-cream/95 px-2.5 py-1 text-[10.5px] font-semibold text-orchard shadow-soft">
                        <Maximize2 className="size-3" />
                        Perbesar Bukti
                      </span>
                    </button>
                  ) : (
                    <p className="mt-2 rounded-xl border border-dashed border-orchard/20 bg-white/70 p-2.5 text-[11px] text-moss">
                      Pembeli belum mengunggah bukti transfer DANA.
                    </p>
                  )
                ) : null}
              </div>
            </div>

            {order.admin_note ? (
              <div className="rounded-2xl border border-orchard/12 bg-custard/45 px-4 py-3 text-xs text-orchard">
                <strong>Catatan Admin:</strong> {order.admin_note}
              </div>
            ) : null}

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-orchard">Rincian Item</span>
                <span className={cn("font-semibold", order.stock_deducted ? "text-emerald-700" : "text-moss")}>
                  {order.stock_deducted ? "✓ Stok sudah dipotong" : "Stok belum dipotong"}
                </span>
              </div>
              <ul className="divide-y divide-orchard/10 rounded-2xl border border-orchard/10 bg-white/80">
                {order.items_json.map((item, idx) => {
                  const desc = describeOrderItem(item);
                  return (
                    <li key={idx} className="flex items-start justify-between gap-3 px-4 py-3 text-xs">
                      <div>
                        <p className="font-semibold text-orchard">{desc.title}</p>
                        <p className="text-moss">{desc.detail}</p>
                        <p className="mt-0.5 font-mono text-[11px] text-moss tabular">
                          {item.quantity} × {formatRupiah(item.unit_price)}
                        </p>
                      </div>
                      <span className="font-mono text-sm font-bold text-orchard tabular">
                        {formatRupiah(item.line_total)}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <div className="space-y-1.5 px-1 pt-2 text-xs">
                {order.subtotal_amount ? (
                  <div className="flex items-center justify-between text-moss">
                    <span>Subtotal Produk</span>
                    <span className="font-mono font-semibold text-orchard tabular">
                      {formatRupiah(order.subtotal_amount)}
                    </span>
                  </div>
                ) : null}
                {order.addons_json && order.addons_json.length > 0 ? (
                  order.addons_json.map((addon, i) => (
                    <div key={i} className="flex items-center justify-between text-moss">
                      <span>Add-on: {addon.name}</span>
                      <span className="font-mono font-semibold text-orchard tabular">
                        +{formatRupiah(addon.price)}
                      </span>
                    </div>
                  ))
                ) : null}
                {order.delivery_zone_name ? (
                  <div className="flex items-center justify-between text-moss">
                    <span>Ongkir ({order.delivery_zone_name})</span>
                    <span className="font-mono font-semibold text-orchard tabular">
                      {(order.shipping_fee ?? 0) === 0 ? "Gratis" : `+${formatRupiah(order.shipping_fee ?? 0)}`}
                    </span>
                  </div>
                ) : null}
                {order.voucher_code && (order.discount_amount ?? 0) > 0 ? (
                  <div className="flex items-center justify-between text-emerald-800">
                    <span>Diskon ({order.voucher_code})</span>
                    <span className="font-mono font-semibold tabular">
                      -{formatRupiah(order.discount_amount ?? 0)}
                    </span>
                  </div>
                ) : null}
                <div className="flex items-baseline justify-between border-t border-orchard/10 pt-2">
                  <span className="text-sm font-semibold text-moss">Total</span>
                  <span className="font-mono text-xl font-bold text-orchard tabular">
                    {formatRupiah(order.total_amount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Approval & Fulfillment Controls */}
            <div className="space-y-3 rounded-2xl border border-orchard/12 bg-cream-2/55 p-4">
              {order.payment_method === "dana" && canApprove ? (
                <div className="flex items-center justify-between gap-3 border-b border-orchard/10 pb-3">
                  <div>
                    <p className="text-xs font-bold text-orchard">Verifikasi Pembayaran DANA</p>
                    <p className="text-[11px] text-moss">
                      Tandai pembayaran DANA lunas otomatis saat pesanan disetujui.
                    </p>
                  </div>
                  <Switch checked={verifyPayment} onCheckedChange={setVerifyPayment} aria-label="Verifikasi DANA" />
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {canApprove ? (
                  <Button size="sm" variant="gold" disabled={pending} onClick={() => handleDirectAction("approve")}>
                    <CheckCircle2 className="size-3.5" />
                    Approve / Setujui Pesanan
                  </Button>
                ) : null}

                {order.approval_status === "approved" && order.status === "approved" ? (
                  <Button size="sm" variant="orchard" disabled={pending} onClick={() => handleDirectAction("preparing")}>
                    <PackageCheck className="size-3.5" />
                    Proses &amp; Kemas
                  </Button>
                ) : null}

                {order.approval_status === "approved" &&
                (order.status === "approved" || order.status === "preparing") ? (
                  <Button
                    size="sm"
                    variant="orchard"
                    disabled={pending}
                    onClick={() => handleDirectAction("ready_or_shipping")}
                  >
                    <Truck className="size-3.5" />
                    Siap Diambil / Dikirim
                  </Button>
                ) : null}

                {order.approval_status === "approved" && order.status !== "completed" && order.status !== "cancelled" ? (
                  <Button size="sm" variant="gold" disabled={pending} onClick={() => handleDirectAction("completed")}>
                    <CheckCircle2 className="size-3.5" />
                    Tandai Selesai
                  </Button>
                ) : null}

                {canReject ? (
                  <Button size="sm" variant="danger" disabled={pending} onClick={() => handleDirectAction("reject")}>
                    <XCircle className="size-3.5" />
                    Tolak Pesanan
                  </Button>
                ) : null}

                {order.status !== "cancelled" && order.status !== "completed" && order.status !== "rejected" ? (
                  <Button size="sm" variant="outline" disabled={pending} onClick={() => handleDirectAction("cancelled")}>
                    Batalkan
                  </Button>
                ) : null}
              </div>
            </div>

            {order.status_history_json.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-orchard">Log Aktivitas</p>
                <ul className="max-h-36 space-y-1.5 overflow-y-auto rounded-2xl border border-orchard/10 bg-white/75 p-3 text-[11px]">
                  {[...order.status_history_json].reverse().map((h, i) => (
                    <li key={i} className="flex justify-between gap-2 text-bark">
                      <span>
                        <strong>{ORDER_STATUS_META[h.status]?.short ?? h.status}:</strong> {h.note}
                      </span>
                      <span className="shrink-0 font-mono text-moss">{formatDateTime(h.timestamp)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-orchard/10 pt-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-crimson hover:underline"
              >
                <Trash2 className="size-3.5" />
                Hapus Catatan
              </button>

              <a
                href={waUpdateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-orchard px-4 text-xs font-semibold text-cream hover:bg-orchard-2"
              >
                <MessageCircle className="size-3.5 text-gold" />
                Kabari Pembeli via WhatsApp
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox bukti transfer */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-3xl overflow-hidden bg-orchard p-3">
          <DialogTitle className="sr-only">Bukti Transfer {order.order_code}</DialogTitle>
          <DialogDescription className="sr-only">Pratinjau ukuran penuh bukti transfer DANA</DialogDescription>
          {order.payment_proof_url ? (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
              <ProductImage src={order.payment_proof_url} alt="Bukti Transfer DANA" fill sizes="900px" className="object-contain" />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Confirm Approve / Reject / Cancel */}
      <ConfirmDialog
        open={pendingAction !== null}
        onOpenChange={(o) => { if (!o) setPendingAction(null); }}
        title={
          pendingAction === "approve"
            ? `Setujui ${order.order_code}?`
            : pendingAction === "reject"
              ? `Tolak ${order.order_code}?`
              : `Batalkan ${order.order_code}?`
        }
        description={
          pendingAction === "approve"
            ? "Stok produk (butir/gram) akan dipotong secara atomik di database dan status pesanan menjadi Disetujui."
            : pendingAction === "reject"
              ? "Alasan penolakan akan terlihat oleh pembeli di halaman invoice & lacak pesanan. Stok yang sempat dipotong akan dikembalikan."
              : "Pesanan akan dibatalkan dan stok yang sempat dipotong otomatis dikembalikan."
        }
        confirmLabel={
          pendingAction === "approve"
            ? "Ya, Setujui & Potong Stok"
            : pendingAction === "reject"
              ? "Tolak Pesanan"
              : "Batalkan Pesanan"
        }
        confirmVariant={pendingAction === "approve" ? "gold" : "danger"}
        noteLabel={pendingAction === "reject" ? "Alasan Penolakan (Wajib)" : "Catatan Admin (Opsional)"}
        notePlaceholder={
          pendingAction === "reject"
            ? "Contoh: Stok Bawor hari ini habis / Bukti transfer belum sesuai…"
            : "Contoh: Buah sudah dipilihkan yang legit, siap diambil sore ini…"
        }
        requireNote={pendingAction === "reject"}
        quickReasons={
          pendingAction === "reject"
            ? [
                "Stok varietas pilihan sedang habis hari ini",
                "Bukti transfer DANA tidak valid / belum masuk",
                "Alamat di luar jangkauan kurir lokal",
              ]
            : undefined
        }
        pending={pending}
        onConfirm={(note) => {
          if (pendingAction) runAction(pendingAction, note);
        }}
      />

      {/* Confirm Delete */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title={`Hapus Catatan ${order.order_code}?`}
        description="Data pesanan akan dihapus permanen dari database. Stok produk tidak diubah saat penghapusan paksa."
        confirmLabel="Hapus Permanen"
        confirmVariant="danger"
        pending={pending}
        onConfirm={handleDelete}
      />
    </>
  );
}
