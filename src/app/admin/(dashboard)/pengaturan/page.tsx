import type { Metadata } from "next";

import { SettingsForm } from "@/components/admin/settings-form";
import { getAdminSession, getAdminSettings } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Pengaturan Toko" };

export default async function AdminSettingsPage() {
  const [session, settings] = await Promise.all([getAdminSession(), getAdminSettings()]);
  return <SettingsForm settings={settings} configured={session.configured} />;
}
