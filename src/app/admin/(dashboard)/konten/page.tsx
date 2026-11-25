import type { Metadata } from "next";

import { ContentManager } from "@/components/admin/content-manager";
import { getAdminSession, getAdminSettings } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Konten & Copywriting" };

export default async function AdminContentPage() {
  const [session, settings] = await Promise.all([getAdminSession(), getAdminSettings()]);
  return <ContentManager settings={settings} configured={session.configured} />;
}
