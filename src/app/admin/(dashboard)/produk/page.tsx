import type { Metadata } from "next";

import { ProductsManager } from "@/components/admin/products-manager";
import { getAdminCategories, getAdminProducts, getAdminSession } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Katalog & Stok" };

export default async function AdminProductsPage() {
  const [session, products, categories] = await Promise.all([
    getAdminSession(),
    getAdminProducts(),
    getAdminCategories(),
  ]);
  return <ProductsManager products={products} categories={categories} configured={session.configured} />;
}
