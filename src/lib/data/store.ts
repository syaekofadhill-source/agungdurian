import "server-only";

import { cache } from "react";

import { MOCK_PRODUCTS, MOCK_SETTINGS, MOCK_TESTIMONIALS } from "@/lib/mock-data";
import { createSupabasePublicClient } from "@/lib/supabase/server";
import type { Product, StoreSettings, Testimonial } from "@/types/database";

/**
 * Public storefront reads. Each function degrades to typed seed data when
 * Supabase is not configured (demo mode) or temporarily unreachable, so the
 * homepage never white-screens.
 */

function normalizeProduct(p: Product): Product {
  // PostgREST returns numeric columns as strings in some setups — coerce defensively.
  return { ...p, avg_weight_kg: Number(p.avg_weight_kg) };
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
  if (!data) return MOCK_SETTINGS;
  return {
    ...MOCK_SETTINGS,
    ...data,
    google_rating: Number(data.google_rating),
    marquee_items: data.marquee_items?.length ? data.marquee_items : MOCK_SETTINGS.marquee_items,
  };
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
