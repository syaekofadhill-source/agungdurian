import type { Metadata } from "next";

import { OrdersManager } from "@/components/admin/orders-manager";
import { getAdminOrders, getAdminSession } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Pesanan WA" };

export default async function AdminOrdersPage() {
  const [session, orders] = await Promise.all([getAdminSession(), getAdminOrders()]);
  return <OrdersManager orders={orders} configured={session.configured} />;
}
