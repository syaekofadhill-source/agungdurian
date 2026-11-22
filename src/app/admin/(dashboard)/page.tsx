import { AlertTriangle, ArrowRight, ClipboardList, Coins, PackageCheck, ShoppingBag } from "lucide-react";
import Link from "next/link";

import { LOW_STOCK_BUTIR, LOW_STOCK_GRAM, ORDER_STATUS_META } from "@/lib/constants";
import { getAdminOverviewData } from "@/lib/data/admin";
import { cn, formatDateTime, formatNumber, formatRupiah } from "@/lib/utils";

export default async function AdminOverviewPage() {
  const data = await getAdminOverviewData();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-hover">Dashboard Kebun</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-orchard">Ringkasan Operasional</h1>
        </div>
        <div className="flex gap-2.5">
          <Link
            href="/admin/produk"
            className="inline-flex h-10 items-center rounded-full border border-orchard/15 bg-white px-4 text-xs font-semibold text-orchard transition hover:border-orchard/40"
          >
            Kelola Stok
          </Link>
          <Link
            href="/admin/pesanan"
            className="inline-flex h-10 items-center rounded-full bg-gold px-4 text-xs font-semibold text-orchard shadow-soft transition hover:bg-gold-hover"
          >
            Lihat Pesanan WA
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-orchard/10 bg-white/85 p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-moss">Produk Aktif</span>
            <PackageCheck className="size-4 text-orchard" />
          </div>
          <p className="mt-3 font-mono text-3xl font-bold text-orchard tabular">{data.activeProductsCount}</p>
          <p className="mt-1 text-xs text-moss">dari {data.totalProductsCount} varietas terdaftar</p>
        </div>

        <div className="rounded-3xl border border-orchard/10 bg-white/85 p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-moss">Pesanan Hari Ini / Total</span>
            <ShoppingBag className="size-4 text-orchard" />
          </div>
          <p className="mt-3 font-mono text-3xl font-bold text-orchard tabular">
            {data.ordersTodayCount} <span className="text-lg font-normal text-moss">/ {data.totalOrdersCount}</span>
          </p>
          <p className="mt-1 text-xs text-moss">{data.pendingOrdersCount} menunggu konfirmasi</p>
        </div>

        <div className="rounded-3xl border border-orchard/10 bg-white/85 p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-moss">Estimasi Nilai Order WA</span>
            <Coins className="size-4 text-gold-hover" />
          </div>
          <p className="mt-3 font-mono text-2xl font-bold text-orchard tabular sm:text-[1.65rem]">
            {formatRupiah(data.estimatedRevenue)}
          </p>
          <p className="mt-1 text-xs text-moss">Akumulasi non-batal</p>
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
            <span className="text-xs font-semibold text-moss">Alert Stok Menipis</span>
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
          <p className="mt-1 text-xs text-moss">Butir ≤ {LOW_STOCK_BUTIR} atau Gram ≤ {formatNumber(LOW_STOCK_GRAM)}g</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="rounded-3xl border border-orchard/10 bg-white/85 p-6 shadow-soft lg:col-span-7">
          <div className="flex items-center justify-between border-b border-orchard/10 pb-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="size-4 text-orchard" />
              <h2 className="font-display text-lg font-bold text-orchard">Pesanan WA Terbaru</h2>
            </div>
            <Link href="/admin/pesanan" className="inline-flex items-center gap-1 text-xs font-semibold text-orchard hover:underline">
              Semua pesanan <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {data.recentOrders.length > 0 ? (
            <ul className="divide-y divide-orchard/10">
              {data.recentOrders.map((order) => {
                const badge = ORDER_STATUS_META[order.status];
                return (
                  <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5 text-sm">
                    <div>
                      <p className="font-mono text-xs font-bold text-orchard tabular">{order.order_code}</p>
                      <p className="font-semibold text-bark">{order.customer_name}</p>
                      <p className="text-xs text-moss">{formatDateTime(order.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1",
                          badge.className,
                        )}
                      >
                        {badge.label}
                      </span>
                      <p className="mt-1 font-mono text-sm font-bold text-orchard tabular">
                        {formatRupiah(order.total_amount)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-10 text-center text-sm text-moss">
              Belum ada pesanan masuk. Pesanan dari checkout WhatsApp akan muncul otomatis di sini.
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
