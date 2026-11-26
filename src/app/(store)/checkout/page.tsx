import type { Metadata } from "next";

import { CheckoutClient } from "@/components/store/checkout-client";
import { getActiveCustomOptions, getActiveDeliveryZones, getStoreSettings } from "@/lib/data/store";

export const metadata: Metadata = {
  title: "Checkout Pesanan",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [settings, customOptions, deliveryZones] = await Promise.all([
    getStoreSettings(),
    getActiveCustomOptions(),
    getActiveDeliveryZones(),
  ]);

  const addons = customOptions.filter((o) => o.option_type === "checkout_addon");

  return <CheckoutClient settings={settings} deliveryZones={deliveryZones} addons={addons} />;
}
