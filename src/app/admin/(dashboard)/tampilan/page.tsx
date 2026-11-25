import type { Metadata } from "next";

import { MediaManager } from "@/components/admin/media-manager";
import { getAdminSession, getAdminSettings } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Tampilan & Foto Web" };

export default async function AdminMediaPage() {
  const [session, settings] = await Promise.all([getAdminSession(), getAdminSettings()]);
  return <MediaManager settings={settings} configured={session.configured} />;
}
