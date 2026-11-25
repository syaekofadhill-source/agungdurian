import type { Metadata } from "next";

import { CheckoutClient } from "@/components/store/checkout-client";
import { getStoreSettings } from "@/lib/data/store";

export const metadata: Metadata = {
  title: "Checkout Pesanan",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const settings = await getStoreSettings();
  return <CheckoutClient settings={settings} />;
}
