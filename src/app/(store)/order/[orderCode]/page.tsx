import type { Metadata } from "next";

import { OrderInvoiceClient } from "@/components/store/order-invoice-client";
import { getPublicOrderByCode, getStoreSettings } from "@/lib/data/store";

export const metadata: Metadata = {
  title: "Invoice Pesanan",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function OrderInvoicePage({
  params,
}: {
  params: Promise<{ orderCode: string }>;
}) {
  const { orderCode } = await params;
  const decoded = decodeURIComponent(orderCode).toUpperCase();
  const [order, settings] = await Promise.all([getPublicOrderByCode(decoded), getStoreSettings()]);

  return <OrderInvoiceClient initialOrder={order} orderCode={decoded} settings={settings} />;
}
