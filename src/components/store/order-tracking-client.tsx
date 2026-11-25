"use client";

import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { trackOrdersAction } from "@/lib/actions/orders";
import {
  APPROVAL_STATUS_META,
  ORDER_STATUS_META,
  PAYMENT_METHOD_META,
  PAYMENT_STATUS_META,
} from "@/lib/constants";
import { cn, formatDateTime, formatRupiah } from "@/lib/utils";
import type { PublicOrder } from "@/types/database";

export function OrderTrackingClient({
  initialQuery,
  initialResults = null,
}: {
  initialQuery?: string;
  initialResults?: PublicOrder[] | null;
}) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [results, setResults] = useState<PublicOrder[] | null>(initialResults);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await trackOrdersAction(query);
      if (!res.ok) {
        setError(res.error);
        setResults(null);
        return;
      }
      setResults(res.data ?? []);
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-hover">Lacak Pesanan</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-orchard sm:text-4xl">
          Pantau status persetujuan &amp; pengiriman durian Anda.
        </h1>
        <p className="mt-2 text-sm text-moss">
          Masukkan kode invoice (<span className="font-mono font-semibold text-orchard">AGD-YYYYMMDD-XXXX</span>) atau
          nomor WhatsApp yang Anda gunakan saat checkout.
        </p>

        <form onSubmit={handleSearch} className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-moss" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Contoh: AGD-20261125-DANA atau 081223344556"
              className="h-12 rounded-full pl-11"
            />
          </div>
          <Button type="submit" variant="gold" size="lg" disabled={pending}>
            {pending ? "Mencari…" : "Lacak Pesanan"}
          </Button>
        </form>

        {error ? (
          <p role="alert" className="mt-3 text-xs font-medium text-crimson">
            {error}
          </p>
        ) : null}
      </div>

      {results !== null ? (
        results.length === 0 ? (
          <div className="rounded-3xl border border-orchard/10 bg-white/80 p-10 text-center shadow-soft">
            <p className="font-display text-xl font-bold text-orchard">Pesanan tidak ditemukan</p>
            <p className="mt-1.5 text-sm text-moss">
              Pastikan kode invoice atau nomor WhatsApp sudah benar sesuai saat checkout.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((order) => {
              const statusMeta = ORDER_STATUS_META[order.status];
              const approvalMeta = APPROVAL_STATUS_META[order.approval_status];
              const payMeta = PAYMENT_METHOD_META[order.payment_method];
              const payStat = PAYMENT_STATUS_META[order.payment_status];

              return (
                <article
                  key={order.order_code}
                  className="rounded-3xl border border-orchard/10 bg-white/90 p-6 shadow-soft"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-base font-bold text-orchard tabular">{order.order_code}</span>
                        <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1", statusMeta.className)}>
                          {statusMeta.label}
                        </span>
                        <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1", approvalMeta.className)}>
                          {approvalMeta.label}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-moss">
                        {order.customer_name} ({order.masked_phone}) · {formatDateTime(order.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xl font-bold text-orchard tabular">
                        {formatRupiah(order.total_amount)}
                      </span>
                      <div className="mt-1 flex flex-wrap justify-end gap-1.5">
                        <span className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1", payMeta.badgeClass)}>
                          {payMeta.short}
                        </span>
                        <span className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1", payStat.className)}>
                          {payStat.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {order.admin_note ? (
                    <p className="mt-3 rounded-2xl bg-cream-2/70 px-4 py-2.5 text-xs text-bark">
                      <strong>Catatan Admin:</strong> {order.admin_note}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-orchard/10 pt-4">
                    <span className="text-xs text-moss">
                      {order.items_json.length} baris produk ·{" "}
                      {order.status_history_json[order.status_history_json.length - 1]?.note ?? statusMeta.label}
                    </span>
                    <Link
                      href={`/order/${order.order_code}`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-orchard px-4 text-xs font-semibold text-cream transition hover:bg-orchard-2"
                    >
                      Buka Invoice &amp; Timeline
                      <ArrowRight className="size-3.5 text-gold" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )
      ) : null}
    </div>
  );
}
