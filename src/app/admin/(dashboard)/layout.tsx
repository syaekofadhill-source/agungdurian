import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminSession } from "@/lib/data/admin";

export const metadata: Metadata = {
  title: { default: "Admin CMS", template: "%s · Admin AgungDurian" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  return (
    <AdminShell userEmail={session.userEmail} configured={session.configured}>
      {children}
    </AdminShell>
  );
}
