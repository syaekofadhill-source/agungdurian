import "server-only";

import { cache } from "react";

import {
  MOCK_CUSTOM_OPTIONS,
  MOCK_DELIVERY_ZONES,
  MOCK_ORDERS,
  MOCK_PRODUCTS,
  MOCK_SETTINGS,
  MOCK_TESTIMONIALS,
  toPublicOrder,
} from "@/lib/mock-data";
import { hydrateStoreSettings } from "@/lib/settings-helper";
import { createSupabasePublicClient } from "@/lib/supabase/server";
import type {
  CustomOption,
  DeliveryZone,
  Product,
  PublicOrder,
  StoreSettings,
  Testimonial,
} from "@/types/database";

function normalizeProduct(p: Product): Product {
  return { ...p, avg_weight_kg: Number(p.avg_weight_kg) };
}

function normalizeOption(o: CustomOption): CustomOption {
  return { ...o, price_multiplier: Number(o.price_multiplier) };
}

function summarizeSupabaseError(message: string): string {
  if (message.trimStart().startsWith("<")) {
    return "Respons bukan JSON (periksa NEXT_PUBLIC_SUPABASE_URL di .env.local)";
  }
  return message;
}

export const getStoreSettings = cache(async (): Promise<StoreSettings> => {
  const supabase = createSupabasePublicClient();
  if (!supabase) return MOCK_SETTINGS;
  const { data, error } = await supabase.from("store_settings").select("*").eq("id", 1).maybeSingle();
  if (error) {
    console.warn("[store] gagal memuat store_settings:", summarizeSupabaseError(error.message));
    return MOCK_SETTINGS;
  }
  return hydrateStoreSettings(data);
});

export const getActiveProducts = cache(async (): Promise<Product[]> => {
  const supabase = createSupabasePublicClient();
  if (!supabase) return MOCK_PRODUCTS;
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    console.warn("[store] gagal memuat produk:", summarizeSupabaseError(error.message));
    return MOCK_PRODUCTS;
  }
  return (data ?? []).map(normalizeProduct);
});

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  const products = await getActiveProducts();
  return products.find((p) => p.slug === slug) ?? null;
});

export const getVisibleTestimonials = cache(async (): Promise<Testimonial[]> => {
  const supabase = createSupabasePublicClient();
  if (!supabase) return MOCK_TESTIMONIALS;
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .eq("is_visible", true)
    .order("created_at", { ascending: false })
    .limit(12);
  if (error) {
    console.warn("[store] gagal memuat testimoni:", summarizeSupabaseError(error.message));
    return MOCK_TESTIMONIALS;
  }
  return data ?? [];
});

export const getActiveCustomOptions = cache(async (): Promise<CustomOption[]> => {
  const supabase = createSupabasePublicClient();
  if (!supabase) return MOCK_CUSTOM_OPTIONS;
  const { data, error } = await supabase
    .from("custom_options")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    console.warn("[store] gagal memuat custom_options:", summarizeSupabaseError(error.message));
    return MOCK_CUSTOM_OPTIONS;
  }
  return data && data.length > 0 ? data.map(normalizeOption) : MOCK_CUSTOM_OPTIONS;
});

export const getActiveDeliveryZones = cache(async (): Promise<DeliveryZone[]> => {
  const supabase = createSupabasePublicClient();
  if (!supabase) return MOCK_DELIVERY_ZONES;
  const { data, error } = await supabase
    .from("delivery_zones")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    console.warn("[store] gagal memuat delivery_zones:", summarizeSupabaseError(error.message));
    return MOCK_DELIVERY_ZONES;
  }
  return data && data.length > 0 ? data : MOCK_DELIVERY_ZONES;
});

export async function getPublicOrderByCode(orderCode: string): Promise<PublicOrder | null> {
  const code = orderCode.trim().toUpperCase();
  const supabase = createSupabasePublicClient();
  if (!supabase) {
    const found = MOCK_ORDERS.find((o) => o.order_code.toUpperCase() === code);
    return found ? toPublicOrder(found) : null;
  }
  const { data, error } = await supabase.rpc("get_public_order", { p_order_code: code });
  if (error) {
    console.warn("[store] gagal memuat invoice:", summarizeSupabaseError(error.message));
    return null;
  }
  return data ?? null;
}
