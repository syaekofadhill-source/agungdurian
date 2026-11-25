"use client";

import { Eye, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { OrderDetailModal } from "@/components/admin/order-detail-modal";
import {
  APPROVAL_STATUS_META,
  DELIVERY_METHOD_META,
  ORDER_STATUS_META,
  PAYMENT_METHOD_META,
  PAYMENT_STATUS_META,
} from "@/lib/constants";
import { cn, formatDateTime, formatRupiah, prettyPhone } from "@/lib/utils";
import type { Order, PaymentMethod } from "@/types/database";

type TabKey = "pending_approval" | "active" | "completed" | "rejected_cancelled" | "semua";

export function OrdersManager({
  orders,
  storeName,
  configured,
}: {
  orders: Order[];
  storeName: string;
  configured: boolean;
}) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabKey>("pending_approval");
  const [payFilter, setPayFilter] = useState<PaymentMethod | "semua">("semua");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(() => orders.find((o) => o.id === selectedId) ?? null, [orders, selectedId]);

  const counts = useMemo(
    () => ({
      pending_approval: orders.filter((o) => o.status === "pending_approval").length,
      active: orders.filter((o) => ["approved", "preparing", "ready_or_shipping"].includes(o.status)).length,
      completed: orders.filter((o) => o.status === "completed").length,
      rejected_cancelled: orders.filter((o) => o.status === "rejected" || o.status === "cancelled").length,
      semua: orders.length,
    }),
    [orders],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (tab === "pending_approval" && o.status !== "pending_approval") return false;
      if (tab === "active" && !["approved", "preparing", "ready_or_shipping"].includes(o.status)) return false;
      if (tab === "completed" && o.status !== "completed") return false;
      if (tab === "rejected_cancelled" && o.status !== "rejected" && o.status !== "cancelled") return false;

      if (payFilter !== "semua" && o.payment_method !== payFilter) return false;
      if (!q) return true;
      return (
        o.order_code.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_phone.toLowerCase().includes(q)
      );
    });
  }, [orders, tab, payFilter, query]);

  const tabs: ReadonlyArray<{ id: TabKey; label: string }> = [
    { id: "pending_approval", label: "Menunggu Approval" },
    { id: "active", label: "Diproses / Siap" },
    { id: "completed", label: "Selesai" },
    { id: "rejected_cancelled", label: "Ditolak / Batal" },
    { id: "semua", label: "Semua" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-hover">Approval &amp; Verifikasi</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-orchard">Manajemen Pesanan</h1>
      </div>

      <div className="space-y-3 rounded-3xl border border-orchard/10 bg-white/80 p-4 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                  tab === t.id ? "bg-orchard text-cream" : "bg-cream-2 text-moss hover:text-orchard",
                )}
              >
                <span>{t.label}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 font-mono text-[10px] tabular",
                    tab === t.id
                      ? "bg-gold text-orchard"
                      : t.id === "pending_approval" && counts.pending_approval > 0
                        ? "bg-gold/30 text-orchard"
                        : "bg-white/70 text-moss",
                  )}
                >
                  {counts[t.id]}
                </span>
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

        <div className="flex flex-wrap items-center gap-1.5 border-t border-orchard/10 pt-3 text-xs">
          <span className="mr-1 font-semibold text-moss">Metode Bayar:</span>
          {(["semua", "dana", "cod", "ambil_di_tempat"] as const).map((pm) => (
            <button
              key={pm}
              type="button"
              onClick={() => setPayFilter(pm)}
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-semibold transition",
                payFilter === pm
                  ? "bg-gold text-orchard"
                  : "border border-orchard/12 bg-white text-moss hover:text-orchard",
              )}
            >
              {pm === "semua" ? "Semua" : PAYMENT_METHOD_META[pm].short}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-orchard/10 bg-white/85 shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-orchard/10 bg-cream-2/70 text-[11px] font-bold uppercase tracking-wider text-moss">
              <tr>
                <th className="px-5 py-3.5">Invoice</th>
                <th className="px-4 py-3.5">Pelanggan</th>
                <th className="px-4 py-3.5">Pembayaran</th>
                <th className="px-4 py-3.5">Total</th>
                <th className="px-4 py-3.5">Status &amp; Approval</th>
                <th className="px-5 py-3.5 text-right">Tinjau</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orchard/10">
              {filtered.map((order) => {
                const statusBadge = ORDER_STATUS_META[order.status];
                const approvalBadge = APPROVAL_STATUS_META[order.approval_status];
                const payMethod = PAYMENT_METHOD_META[order.payment_method];
                const payStat = PAYMENT_STATUS_META[order.payment_status];

                return (
                  <tr key={order.id} className="transition hover:bg-cream/50">
                    <td className="px-5 py-4">
                      <p className="font-mono text-xs font-bold text-orchard tabular">{order.order_code}</p>
                      <p className="mt-0.5 text-[11px] text-moss">{formatDateTime(order.created_at)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-bark">{order.customer_name}</p>
                      <p className="font-mono text-xs text-moss tabular">{prettyPhone(order.customer_phone)}</p>
                      <p className="text-[11px] text-moss">{DELIVERY_METHOD_META[order.delivery_method].label}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col items-start gap-1">
                        <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1", payMethod.badgeClass)}>
                          {payMethod.short}
                        </span>
                        <span className={cn("rounded-full px-2.5 py-0.5 text-[10.5px] font-medium ring-1", payStat.className)}>
                          {payStat.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-mono font-bold text-orchard tabular">
                      {formatRupiah(order.total_amount)}
                      <span className="block font-sans text-[11px] font-normal text-moss">
                        {order.items_json.length} item
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col items-start gap-1">
                        <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1", statusBadge.className)}>
                          {statusBadge.label}
                        </span>
                        <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1", approvalBadge.className)}>
                          {approvalBadge.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedId(order.id)}
                        className={cn(
                          "inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-semibold transition",
                          order.status === "pending_approval"
                            ? "bg-gold text-orchard shadow-soft hover:bg-gold-hover"
                            : "border border-orchard/15 bg-white text-orchard hover:bg-cream-2",
                        )}
                      >
                        <Eye className="size-3.5" />
                        {order.status === "pending_approval" ? "Tinjau" : "Detail"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 ? (
          <p className="p-12 text-center text-sm text-moss">Tidak ada pesanan di tab atau filter ini.</p>
        ) : null}
      </div>

      <OrderDetailModal
        order={selected}
        storeName={storeName}
        configured={configured}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
