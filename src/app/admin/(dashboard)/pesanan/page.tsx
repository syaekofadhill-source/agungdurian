import type { Metadata } from "next";

import { OrdersManager } from "@/components/admin/orders-manager";
import { getAdminOrders, getAdminSession, getAdminSettings } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Pesanan & Approval" };

export default async function AdminOrdersPage() {
  const [session, orders, settings] = await Promise.all([
    getAdminSession(),
    getAdminOrders(),
    getAdminSettings(),
  ]);
  return <OrdersManager orders={orders} storeName={settings.store_name} configured={session.configured} />;
}
