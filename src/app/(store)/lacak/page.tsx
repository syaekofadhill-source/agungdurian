import type { Metadata } from "next";

import { OrderTrackingClient } from "@/components/store/order-tracking-client";
import { trackOrdersAction } from "@/lib/actions/orders";

export const metadata: Metadata = {
  title: "Lacak Pesanan",
  description: "Pantau status persetujuan admin, verifikasi transfer DANA, dan pengiriman pesanan AgungDurian.",
};

export const dynamic = "force-dynamic";

export default async function LacakPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const initialQuery = sp.q?.trim();
  let initialResults = null;

  if (initialQuery && initialQuery.length >= 6) {
    const res = await trackOrdersAction(initialQuery);
    if (res.ok && res.data) initialResults = res.data;
  }

  return <OrderTrackingClient initialQuery={initialQuery} initialResults={initialResults} />;
}
