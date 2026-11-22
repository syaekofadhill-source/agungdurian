import "server-only";

import { redirect } from "next/navigation";

import { LOW_STOCK_BUTIR, LOW_STOCK_GRAM } from "@/lib/constants";
import { MOCK_ORDERS, MOCK_PRODUCTS, MOCK_SETTINGS, MOCK_TESTIMONIALS } from "@/lib/mock-data";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Order, Product, StoreSettings, Testimonial } from "@/types/database";

export type AdminSession = {
  configured: boolean;
  userEmail: string;
};

export async function getAdminSession(): Promise<AdminSession> {
  if (!isSupabaseConfigured()) {
    return { configured: false, userEmail: "Mode Demo (Pratinjau)" };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { configured: false, userEmail: "Mode Demo (Pratinjau)" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");
  return { configured: true, userEmail: user.email ?? "Admin" };
}

function normalizeProduct(p: Product): Product {
  return { ...p, avg_weight_kg: Number(p.avg_weight_kg) };
}

export async function getAdminProducts(): Promise<Product[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return MOCK_PRODUCTS;

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[admin] gagal memuat produk:", error.message);
    return [];
  }
  return (data ?? []).map(normalizeProduct);
}

export async function getAdminOrders(): Promise<Order[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return MOCK_ORDERS;

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[admin] gagal memuat pesanan:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getAdminSettings(): Promise<StoreSettings> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return MOCK_SETTINGS;

  const { data, error } = await supabase.from("store_settings").select("*").eq("id", 1).maybeSingle();
  if (error || !data) return MOCK_SETTINGS;

  return {
    ...MOCK_SETTINGS,
    ...data,
    google_rating: Number(data.google_rating),
    marquee_items: data.marquee_items?.length ? data.marquee_items : MOCK_SETTINGS.marquee_items,
  };
}

export async function getAdminTestimonials(): Promise<Testimonial[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return MOCK_TESTIMONIALS;

  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin] gagal memuat testimoni:", error.message);
    return [];
  }
  return data ?? [];
}

const jakartaDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Jakarta",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export async function getAdminOverviewData() {
  const [products, orders] = await Promise.all([getAdminProducts(), getAdminOrders()]);
  const todayWib = jakartaDateFormatter.format(new Date());

  const activeProductsCount = products.filter((p) => p.is_active).length;
  const ordersTodayCount = orders.filter((o) => jakartaDateFormatter.format(new Date(o.created_at)) === todayWib).length;
  const pendingOrdersCount = orders.filter((o) => o.status === "pending").length;
  const estimatedRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total_amount, 0);

  const lowStockProducts = products.filter(
    (p) => (p.allow_butir && p.stock_butir <= LOW_STOCK_BUTIR) || (p.allow_gram && p.stock_gram <= LOW_STOCK_GRAM),
  );

  return {
    activeProductsCount,
    totalProductsCount: products.length,
    ordersTodayCount,
    totalOrdersCount: orders.length,
    pendingOrdersCount,
    estimatedRevenue,
    lowStockProducts,
    recentOrders: orders.slice(0, 6),
  };
}
