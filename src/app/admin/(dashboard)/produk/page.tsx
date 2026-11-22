import type { Metadata } from "next";

import { ProductsManager } from "@/components/admin/products-manager";
import { getAdminProducts, getAdminSession } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Katalog & Stok" };

export default async function AdminProductsPage() {
  const [session, products] = await Promise.all([getAdminSession(), getAdminProducts()]);
  return <ProductsManager products={products} configured={session.configured} />;
}
