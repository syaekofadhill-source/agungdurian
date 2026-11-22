"use client";

import { Eye, MessageCircle, Search, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { deleteOrder, updateOrderStatus } from "@/lib/actions/orders";
import { DELIVERY_METHOD_META, ORDER_STATUS_META } from "@/lib/constants";
import { cn, formatDateTime, formatRupiah, prettyPhone } from "@/lib/utils";
import { buildWhatsAppUrl, describeOrderItem } from "@/lib/whatsapp";
import type { Order, OrderStatus } from "@/types/database";

const STATUS_FILTERS: ReadonlyArray<{ value: OrderStatus | "semua"; label: string }> = [
  { value: "semua", label: "Semua" },
  { value: "pending", label: "Menunggu" },
  { value: "confirmed", label: "Dikonfirmasi" },
  { value: "completed", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
];

export function OrdersManager({ orders, configured }: { orders: Order[]; configured: boolean }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "semua">("semua");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deductStock, setDeductStock] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  const selected = useMemo(() => orders.find((o) => o.id === selectedId) ?? null, [orders, selectedId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "semua" && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        o.order_code.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_phone.toLowerCase().includes(q)
      );
    });
  }, [orders, statusFilter, query]);

  function handleStatusChange(orderId: string, status: OrderStatus) {
    if (!configured) {
      toast.info("Mode pratinjau: hubungkan Supabase di .env.local untuk memproses pesanan.");
      return;
    }
    startTransition(async () => {
      const res = await updateOrderStatus({ orderId, status, deductStock });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message ?? "Status pesanan diperbarui.");
    });
  }

  function handleDelete(orderId: string) {
    if (!configured) {
      toast.info("Mode pratinjau: hubungkan Supabase di .env.local untuk menghapus pesanan.");
      return;
    }
    startTransition(async () => {
      const res = await deleteOrder(orderId);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message ?? "Pesanan dihapus.");
      setSelectedId(null);
      setConfirmDelete(false);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-hover">Checkout WhatsApp</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-orchard">Manajemen Pesanan</h1>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-orchard/10 bg-white/80 p-4 shadow-soft">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                statusFilter === f.value ? "bg-orchard text-cream" : "bg-cream-2 text-moss hover:text-orchard",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-moss" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari kode AGD-…, nama, HP…"
            className="h-9 w-full rounded-full border border-orchard/15 bg-cream pl-9 pr-3 text-xs outline-none focus:border-gold"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-orchard/10 bg-white/85 shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="border-b border-orchard/10 bg-cream-2/70 text-[11px] font-bold uppercase tracking-wider text-moss">
              <tr>
                <th className="px-5 py-3.5">Invoice</th>
                <th className="px-4 py-3.5">Pelanggan</th>
                <th className="px-4 py-3.5">Metode &amp; Item</th>
                <th className="px-4 py-3.5">Total</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Rincian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orchard/10">
              {filtered.map((order) => {
                const badge = ORDER_STATUS_META[order.status];
                const items = Array.isArray(order.items_json) ? order.items_json : [];
                return (
                  <tr key={order.id} className="transition hover:bg-cream/50">
                    <td className="px-5 py-4">
                      <p className="font-mono text-xs font-bold text-orchard tabular">{order.order_code}</p>
                      <p className="mt-0.5 text-[11px] text-moss">{formatDateTime(order.created_at)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-bark">{order.customer_name}</p>
                      <p className="font-mono text-xs text-moss tabular">{prettyPhone(order.customer_phone)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-xs font-medium text-orchard">
                        {DELIVERY_METHOD_META[order.delivery_method].label}
                      </p>
                      <p className="text-xs text-moss">{items.length} baris item</p>
                    </td>
                    <td className="px-4 py-4 font-mono font-bold text-orchard tabular">
                      {formatRupiah(order.total_amount)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1",
                          badge.className,
                        )}
                      >
                        {badge.label}
                      </span>
                      {order.stock_deducted ? (
                        <span className="mt-1 block text-[10.5px] font-medium text-emerald-700">Stok dipotong</span>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmDelete(false);
                          setSelectedId(order.id);
                        }}
                        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-orchard/15 bg-white px-3 text-xs font-semibold text-orchard hover:bg-cream-2"
                      >
                        <Eye className="size-3.5" />
                        Detail
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 ? (
          <p className="p-12 text-center text-sm text-moss">
            {orders.length === 0
              ? "Belum ada pesanan tercatat. Pesanan yang dikirim lewat checkout WhatsApp akan masuk ke tabel ini."
              : "Tidak ada pesanan yang sesuai filter."}
          </p>
        ) : null}
      </div>

      <Dialog open={selected !== null} onOpenChange={(o) => { if (!o) { setSelectedId(null); setConfirmDelete(false); } }}>
        <DialogContent className="max-w-xl p-6">
          {selected ? (
            <div className="space-y-5">
              <div className="pr-8">
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="font-mono text-lg font-bold text-orchard tabular">
                    {selected.order_code}
                  </DialogTitle>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1",
                      ORDER_STATUS_META[selected.status].className,
                    )}
                  >
                    {ORDER_STATUS_META[selected.status].label}
                  </span>
                </div>
                <DialogDescription className="mt-1 text-xs text-moss">
                  Masuk pada {formatDateTime(selected.created_at)}
                </DialogDescription>
              </div>

              <div className="space-y-2 rounded-2xl border border-orchard/10 bg-cream-2/60 p-4 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-orchard">{selected.customer_name}</p>
                    <p className="font-mono text-moss tabular">{prettyPhone(selected.customer_phone)}</p>
                  </div>
                  <a
                    href={buildWhatsAppUrl(
                      selected.customer_phone,
                      `Halo ${selected.customer_name}, kami dari AgungDurian menindaklanjuti pesanan ${selected.order_code}.`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 items-center gap-1.5 rounded-full bg-gold px-3.5 text-xs font-semibold text-orchard hover:bg-gold-hover"
                  >
                    <MessageCircle className="size-3.5" />
                    Hubungi Pembeli
                  </a>
                </div>
                <p className="pt-1 font-medium text-bark">
                  Metode: {DELIVERY_METHOD_META[selected.delivery_method].label}
                </p>
                {selected.delivery_address ? <p className="text-moss">Alamat: {selected.delivery_address}</p> : null}
                {selected.notes ? <p className="text-moss">Catatan: {selected.notes}</p> : null}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-orchard">Rincian Item</p>
                <ul className="divide-y divide-orchard/10 rounded-2xl border border-orchard/10 bg-white/80">
                  {(Array.isArray(selected.items_json) ? selected.items_json : []).map((item, idx) => {
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
                <div className="flex items-baseline justify-between px-1 pt-2">
                  <span className="text-sm font-semibold text-moss">Subtotal</span>
                  <span className="font-mono text-xl font-bold text-orchard tabular">
                    {formatRupiah(selected.total_amount)}
                  </span>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-orchard/12 bg-cream-2/50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-orchard">Potong Stok Otomatis</p>
                    <p className="text-[11px] text-moss">
                      {selected.stock_deducted
                        ? "Stok sudah dipotong untuk pesanan ini. Pembatalan otomatis mengembalikan stok."
                        : "Saat mengonfirmasi pesanan, stok butir/gram akan dikurangi secara atomik."}
                    </p>
                  </div>
                  <Switch
                    checked={deductStock}
                    disabled={selected.stock_deducted}
                    onCheckedChange={setDeductStock}
                    aria-label="Potong stok otomatis"
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {selected.status !== "confirmed" ? (
                    <Button
                      size="sm"
                      variant="gold"
                      disabled={pending}
                      onClick={() => handleStatusChange(selected.id, "confirmed")}
                    >
                      Konfirmasi Pesanan
                    </Button>
                  ) : null}
                  {selected.status !== "completed" ? (
                    <Button
                      size="sm"
                      variant="orchard"
                      disabled={pending}
                      onClick={() => handleStatusChange(selected.id, "completed")}
                    >
                      Tandai Selesai
                    </Button>
                  ) : null}
                  {selected.status !== "cancelled" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => handleStatusChange(selected.id, "cancelled")}
                    >
                      Batalkan
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => handleStatusChange(selected.id, "pending")}
                    >
                      Kembalikan ke Menunggu
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-orchard/10 pt-3">
                {!confirmDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-crimson hover:underline"
                  >
                    <Trash2 className="size-3.5" />
                    Hapus Catatan Pesanan
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-crimson">Yakin hapus?</span>
                    <Button size="sm" variant="danger" disabled={pending} onClick={() => handleDelete(selected.id)}>
                      Hapus Permanen
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
                      Batal
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
