import type { Metadata } from "next";

import { CustomizationManager } from "@/components/admin/customization-manager";
import {
  getAdminCustomOptions,
  getAdminDeliveryZones,
  getAdminSession,
  getAdminSettings,
  getAdminVouchers,
} from "@/lib/data/admin";

export const metadata: Metadata = { title: "Kustomisasi Toko" };

export default async function AdminCustomizationPage() {
  const [session, options, zones, vouchers, settings] = await Promise.all([
    getAdminSession(),
    getAdminCustomOptions(),
    getAdminDeliveryZones(),
    getAdminVouchers(),
    getAdminSettings(),
  ]);

  return (
    <CustomizationManager
      options={options}
      zones={zones}
      vouchers={vouchers}
      gramPresets={settings.gram_presets_json}
      configured={session.configured}
    />
  );
}
