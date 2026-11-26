import "server-only";

import { redirect } from "next/navigation";

import { LOW_STOCK_BUTIR, LOW_STOCK_GRAM } from "@/lib/constants";
import {
  MOCK_CUSTOM_OPTIONS,
  MOCK_DELIVERY_ZONES,
  MOCK_ORDERS,
  MOCK_PRODUCTS,
  MOCK_SETTINGS,
  MOCK_TESTIMONIALS,
  MOCK_VOUCHERS,
} from "@/lib/mock-data";
import { hydrateStoreSettings, normalizeOrderRecord } from "@/lib/settings-helper";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CustomOption,
  DeliveryZone,
  Order,
  Product,
  PromoVoucher,
  StoreSettings,
  Testimonial,
} from "@/types/database";

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

function normalizeOption(o: CustomOption): CustomOption {
  return { ...o, price_multiplier: Number(o.price_multiplier) };
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
  return (data ?? []).map(normalizeOrderRecord);
}

export async function getPendingApprovalCount(): Promise<number> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return MOCK_ORDERS.filter((o) => o.status === "pending_approval").length;

  const { count, error } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .or("status.eq.pending_approval,status.eq.pending");

  if (error) return 0;
  return count ?? 0;
}

export async function getAdminSettings(): Promise<StoreSettings> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return MOCK_SETTINGS;

  const { data, error } = await supabase.from("store_settings").select("*").eq("id", 1).maybeSingle();
  if (error || !data) return MOCK_SETTINGS;

  return hydrateStoreSettings(data);
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

export async function getAdminCustomOptions(): Promise<CustomOption[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return MOCK_CUSTOM_OPTIONS;

  const { data, error } = await supabase
    .from("custom_options")
    .select("*")
    .order("option_type", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.warn("[admin] gagal memuat custom_options:", error.message);
    return MOCK_CUSTOM_OPTIONS;
  }
  return (data ?? []).map(normalizeOption);
}

export async function getAdminCategories(): Promise<CustomOption[]> {
  const all = await getAdminCustomOptions();
  const cats = all.filter((o) => o.option_type === "category" && o.is_active);
  return cats.length > 0 ? cats : MOCK_CUSTOM_OPTIONS.filter((o) => o.option_type === "category");
}

export async function getAdminDeliveryZones(): Promise<DeliveryZone[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return MOCK_DELIVERY_ZONES;

  const { data, error } = await supabase
    .from("delivery_zones")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.warn("[admin] gagal memuat delivery_zones:", error.message);
    return MOCK_DELIVERY_ZONES;
  }
  return data ?? [];
}

export async function getAdminVouchers(): Promise<PromoVoucher[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return MOCK_VOUCHERS;

  const { data, error } = await supabase
    .from("promo_vouchers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[admin] gagal memuat promo_vouchers:", error.message);
    return MOCK_VOUCHERS;
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
  const pendingApprovalOrders = orders.filter((o) => o.status === "pending_approval");
  const approvedOrders = orders.filter((o) => o.approval_status === "approved" && o.status !== "cancelled");
  const verifiedRevenue = approvedOrders.reduce((sum, o) => sum + o.total_amount, 0);

  const paymentBreakdown = {
    dana: orders.filter((o) => o.payment_method === "dana").length,
    cod: orders.filter((o) => o.payment_method === "cod").length,
    ambil_di_tempat: orders.filter((o) => o.payment_method === "ambil_di_tempat").length,
  };

  let butirUnits = 0;
  let gramUnits = 0;
  for (const order of orders) {
    if (order.status === "cancelled" || order.status === "rejected") continue;
    for (const item of order.items_json) {
      if (item.mode === "butir") butirUnits += item.quantity;
      else gramUnits += item.quantity;
    }
  }

  const lowStockProducts = products.filter(
    (p) => (p.allow_butir && p.stock_butir <= LOW_STOCK_BUTIR) || (p.allow_gram && p.stock_gram <= LOW_STOCK_GRAM),
  );

  return {
    activeProductsCount,
    totalProductsCount: products.length,
    ordersTodayCount,
    totalOrdersCount: orders.length,
    pendingApprovalCount: pendingApprovalOrders.length,
    approvedOrdersCount: approvedOrders.length,
    verifiedRevenue,
    paymentBreakdown,
    modeBreakdown: { butirUnits, gramUnits },
    lowStockProducts,
    pendingOrders: pendingApprovalOrders.slice(0, 5),
    recentOrders: orders.slice(0, 6),
  };
}
