import { DEFAULT_WHY_ITEMS } from "@/lib/constants";
import { MOCK_SETTINGS } from "@/lib/mock-data";
import type { Order, OrderStatus, StoreSettings, WhyItem } from "@/types/database";

export function hydrateStoreSettings(raw: Partial<StoreSettings> | null | undefined): StoreSettings {
  if (!raw) return MOCK_SETTINGS;

  const whyItems =
    Array.isArray(raw.why_items_json) && raw.why_items_json.length === 4
      ? (raw.why_items_json as WhyItem[])
      : DEFAULT_WHY_ITEMS;

  return {
    ...MOCK_SETTINGS,
    ...raw,
    google_rating: Number(raw.google_rating ?? MOCK_SETTINGS.google_rating),
    google_review_count: Number(raw.google_review_count ?? MOCK_SETTINGS.google_review_count),
    marquee_items: raw.marquee_items?.length ? raw.marquee_items : MOCK_SETTINGS.marquee_items,
    hero_image_url: raw.hero_image_url || MOCK_SETTINGS.hero_image_url,
    og_image_url: raw.og_image_url || MOCK_SETTINGS.og_image_url,
    hero_badge_text: raw.hero_badge_text || MOCK_SETTINGS.hero_badge_text,
    cta_primary_text: raw.cta_primary_text || MOCK_SETTINGS.cta_primary_text,
    footer_description: raw.footer_description || MOCK_SETTINGS.footer_description,
    why_items_json: whyItems,
    payment_dana_enabled: raw.payment_dana_enabled ?? true,
    payment_dana_number: raw.payment_dana_number || MOCK_SETTINGS.payment_dana_number,
    payment_dana_holder: raw.payment_dana_holder || MOCK_SETTINGS.payment_dana_holder,
    payment_dana_instructions: raw.payment_dana_instructions || MOCK_SETTINGS.payment_dana_instructions,
    payment_cod_enabled: raw.payment_cod_enabled ?? true,
    payment_cod_notes: raw.payment_cod_notes || MOCK_SETTINGS.payment_cod_notes,
    payment_pickup_enabled: raw.payment_pickup_enabled ?? true,
    payment_pickup_notes: raw.payment_pickup_notes || MOCK_SETTINGS.payment_pickup_notes,
  };
}

export function normalizeOrderRecord(raw: Order): Order {
  const rawStatus = raw.status as string;
  let status: OrderStatus = raw.status;
  if (rawStatus === "pending") status = "pending_approval";
  else if (rawStatus === "confirmed") status = "approved";

  return {
    ...raw,
    status,
    payment_method: raw.payment_method ?? "ambil_di_tempat",
    payment_status: raw.payment_status ?? "unpaid",
    approval_status: raw.approval_status ?? (status === "rejected" ? "rejected" : status === "pending_approval" ? "pending_approval" : "approved"),
    items_json: Array.isArray(raw.items_json) ? raw.items_json : [],
    status_history_json: Array.isArray(raw.status_history_json) ? raw.status_history_json : [],
  };
}
