import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Coins,
  CreditCard,
  Package,
  Scale,
} from "lucide-react";
import Link from "next/link";

import { LOW_STOCK_BUTIR, LOW_STOCK_GRAM, PAYMENT_METHOD_META } from "@/lib/constants";
import { getAdminOverviewData } from "@/lib/data/admin";
import { cn, formatDateTime, formatNumber, formatRupiah } from "@/lib/utils";

export default async function AdminOverviewPage() {
  const data = await getAdminOverviewData();
  const totalOrdersForPct = Math.max(1, data.totalOrdersCount);
  const totalModeUnits = Math.max(1, data.modeBreakdown.butirUnits + data.modeBreakdown.gramUnits);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-hover">Dashboard Kebun</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-orchard">Ringkasan &amp; Analitik</h1>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/admin/tampilan"
            className="inline-flex h-10 items-center rounded-full border border-orchard/15 bg-white px-4 text-xs font-semibold text-orchard transition hover:border-orchard/40"
          >
            Edit Foto Web
          </Link>
          <Link
            href="/admin/pesanan"
            className="inline-flex h-10 items-center rounded-full bg-gold px-4 text-xs font-semibold text-orchard shadow-soft transition hover:bg-gold-hover"
          >
            Antrean Approval ({data.pendingApprovalCount})
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/admin/pesanan"
          className={cn(
            "rounded-3xl border p-5 shadow-soft transition hover:-translate-y-0.5",
            data.pendingApprovalCount > 0
              ? "border-gold/60 bg-custard/65"
              : "border-orchard/10 bg-white/85",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-orchard">Menunggu Approval</span>
            <Clock className="size-4 text-gold-hover" />
          </div>
          <p className="mt-3 font-mono text-3xl font-bold text-orchard tabular">{data.pendingApprovalCount}</p>
          <p className="mt-1 text-xs font-medium text-moss">
            {data.pendingApprovalCount > 0 ? "Perlu persetujuan & cek bukti →" : "Semua pesanan sudah ditinjau"}
          </p>
        </Link>

        <div className="rounded-3xl border border-orchard/10 bg-white/85 p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-moss">Pesanan Disetujui</span>
            <CheckCircle2 className="size-4 text-emerald-700" />
          </div>
          <p className="mt-3 font-mono text-3xl font-bold text-orchard tabular">
            {data.approvedOrdersCount} <span className="text-lg font-normal text-moss">/ {data.totalOrdersCount}</span>
          </p>
          <p className="mt-1 text-xs text-moss">{data.ordersTodayCount} pesanan masuk hari ini</p>
        </div>

        <div className="rounded-3xl border border-orchard/10 bg-white/85 p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-moss">Omzet Terverifikasi</span>
            <Coins className="size-4 text-gold-hover" />
          </div>
          <p className="mt-3 font-mono text-2xl font-bold text-orchard tabular sm:text-[1.6rem]">
            {formatRupiah(data.verifiedRevenue)}
          </p>
          <p className="mt-1 text-xs text-moss">Dari pesanan yang telah disetujui</p>
        </div>

        <div
          className={cn(
            "rounded-3xl border p-5 shadow-soft",
            data.lowStockProducts.length > 0
              ? "border-crimson/30 bg-crimson/[0.06]"
              : "border-orchard/10 bg-white/85",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-moss">Stok Kritis</span>
            <AlertTriangle
              className={cn("size-4", data.lowStockProducts.length > 0 ? "text-crimson" : "text-orchard")}
            />
          </div>
          <p
            className={cn(
              "mt-3 font-mono text-3xl font-bold tabular",
              data.lowStockProducts.length > 0 ? "text-crimson" : "text-orchard",
            )}
          >
            {data.lowStockProducts.length}
          </p>
          <p className="mt-1 text-xs text-moss">
            Butir ≤ {LOW_STOCK_BUTIR} / Gram ≤ {formatNumber(LOW_STOCK_GRAM)}g
          </p>
        </div>
      </div>

      {/* Breakdown Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-orchard/10 bg-white/85 p-6 shadow-soft">
          <div className="flex items-center gap-2 border-b border-orchard/10 pb-3">
            <CreditCard className="size-4 text-orchard" />
            <h2 className="font-display text-lg font-bold text-orchard">Distribusi Metode Pembayaran</h2>
          </div>
          <div className="mt-4 space-y-3">
            {(["dana", "cod", "ambil_di_tempat"] as const).map((method) => {
              const count = data.paymentBreakdown[method];
              const pct = Math.round((count / totalOrdersForPct) * 100);
              return (
                <div key={method} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-bark">{PAYMENT_METHOD_META[method].label}</span>
                    <span className="font-mono font-bold text-orchard tabular">
                      {count} order ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-cream-2">
                    <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-orchard/10 bg-white/85 p-6 shadow-soft">
          <div className="flex items-center gap-2 border-b border-orchard/10 pb-3">
            <Scale className="size-4 text-orchard" />
            <h2 className="font-display text-lg font-bold text-orchard">Perbandingan Mode Jual</h2>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-orchard/10 bg-cream-2/50 p-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-moss">
                <Package className="size-3.5 text-orchard" /> Per Butir (Utuh)
              </span>
              <p className="mt-2 font-mono text-2xl font-bold text-orchard tabular">
                {data.modeBreakdown.butirUnits}{" "}
                <span className="text-xs font-normal text-moss">
                  ({Math.round((data.modeBreakdown.butirUnits / totalModeUnits) * 100)}%)
                </span>
              </p>
            </div>
            <div className="rounded-2xl border border-orchard/10 bg-cream-2/50 p-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-moss">
                <Scale className="size-3.5 text-orchard" /> Per Gram (Kupas)
              </span>
              <p className="mt-2 font-mono text-2xl font-bold text-orchard tabular">
                {data.modeBreakdown.gramUnits}{" "}
                <span className="text-xs font-normal text-moss">
                  ({Math.round((data.modeBreakdown.gramUnits / totalModeUnits) * 100)}%)
                </span>
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-moss">
            {data.activeProductsCount} dari {data.totalProductsCount} varietas aktif dijual di etalase publik.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="rounded-3xl border border-orchard/10 bg-white/85 p-6 shadow-soft lg:col-span-7">
          <div className="flex items-center justify-between border-b border-orchard/10 pb-4">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-gold-hover" />
              <h2 className="font-display text-lg font-bold text-orchard">Antrean Menunggu Persetujuan</h2>
            </div>
            <Link
              href="/admin/pesanan"
              className="inline-flex items-center gap-1 text-xs font-semibold text-orchard hover:underline"
            >
              Kelola semua <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {data.pendingOrders.length > 0 ? (
            <ul className="divide-y divide-orchard/10">
              {data.pendingOrders.map((order) => (
                <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5 text-sm">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-orchard tabular">{order.order_code}</span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1",
                          PAYMENT_METHOD_META[order.payment_method].badgeClass,
                        )}
                      >
                        {PAYMENT_METHOD_META[order.payment_method].short}
                      </span>
                    </div>
                    <p className="mt-0.5 font-semibold text-bark">{order.customer_name}</p>
                    <p className="text-xs text-moss">{formatDateTime(order.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-orchard tabular">
                      {formatRupiah(order.total_amount)}
                    </span>
                    <Link
                      href="/admin/pesanan"
                      className="rounded-full bg-gold px-3.5 py-1.5 text-xs font-bold text-orchard hover:bg-gold-hover"
                    >
                      Tinjau
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-10 text-center text-sm text-moss">
              Tidak ada pesanan yang menunggu approval saat ini.
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-orchard/10 bg-white/85 p-6 shadow-soft lg:col-span-5">
          <div className="flex items-center justify-between border-b border-orchard/10 pb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-crimson" />
              <h2 className="font-display text-lg font-bold text-orchard">Perlu Restok Segera</h2>
            </div>
            <Link href="/admin/produk" className="text-xs font-semibold text-orchard hover:underline">
              Atur stok →
            </Link>
          </div>

          {data.lowStockProducts.length > 0 ? (
            <ul className="divide-y divide-orchard/10">
              {data.lowStockProducts.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-3.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-bark">{p.name}</p>
                    <p className="text-xs text-moss">
                      {p.allow_butir ? `Butir: ${p.stock_butir}` : null}
                      {p.allow_butir && p.allow_gram ? " · " : null}
                      {p.allow_gram ? `Gram: ${formatNumber(p.stock_gram)}g` : null}
                    </p>
                  </div>
                  <Link
                    href="/admin/produk"
                    className="shrink-0 rounded-full bg-cream-2 px-3 py-1 text-xs font-semibold text-orchard hover:bg-gold"
                  >
                    Tambah
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-10 text-center text-sm text-moss">Semua stok butir &amp; gram dalam kondisi aman.</p>
          )}
        </div>
      </div>
    </div>
  );
}
