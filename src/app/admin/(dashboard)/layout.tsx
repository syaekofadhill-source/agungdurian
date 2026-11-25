import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminSession, getPendingApprovalCount } from "@/lib/data/admin";

export const metadata: Metadata = {
  title: { default: "Admin CMS", template: "%s · Admin AgungDurian" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const [session, pendingApprovalCount] = await Promise.all([
    getAdminSession(),
    getPendingApprovalCount(),
  ]);

  return (
    <AdminShell
      userEmail={session.userEmail}
      configured={session.configured}
      pendingApprovalCount={pendingApprovalCount}
    >
      {children}
    </AdminShell>
  );
}
