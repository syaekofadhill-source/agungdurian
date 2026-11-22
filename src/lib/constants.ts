import type {
  ButirPreparation,
  ButirSize,
  DeliveryMethod,
  GramPackaging,
  HarvestStatus,
  OrderStatus,
  VarietyCategory,
} from "@/types/database";

export const CATEGORY_LABEL: Record<VarietyCategory, string> = {
  lokal: "Lokal Sigaluh",
  premium: "Premium / Unggulan",
  kupas: "Paket Kupas / Box",
};

export const CATEGORY_FILTERS: ReadonlyArray<{ value: VarietyCategory | "semua"; label: string }> = [
  { value: "semua", label: "Semua" },
  { value: "lokal", label: "Lokal Sigaluh" },
  { value: "premium", label: "Premium / Unggulan" },
  { value: "kupas", label: "Paket Kupas / Box" },
];

export const HARVEST_STATUS_META: Record<
  HarvestStatus,
  { label: string; short: string; tone: "gold" | "crimson" | "emerald" }
> = {
  panen_raya: { label: "Panen Raya", short: "Panen raya", tone: "emerald" },
  stok_terbatas: { label: "Stok Terbatas", short: "Stok terbatas", tone: "crimson" },
  pre_order: { label: "Pre-Order Musim Depan", short: "Pre-order", tone: "gold" },
};

export const ORDER_STATUS_META: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: "Menunggu", className: "bg-gold/15 text-[#8a5f00] ring-gold/40" },
  confirmed: { label: "Dikonfirmasi", className: "bg-emerald-700/10 text-emerald-800 ring-emerald-700/30" },
  completed: { label: "Selesai", className: "bg-orchard/10 text-orchard ring-orchard/30" },
  cancelled: { label: "Dibatalkan", className: "bg-crimson/10 text-crimson ring-crimson/30" },
};

export const DELIVERY_METHOD_META: Record<DeliveryMethod, { label: string; hint: string; needsAddress: boolean }> = {
  pickup: {
    label: "Ambil di Kebun Sigaluh",
    hint: "Datang langsung, bisa cicip & makan di tempat.",
    needsAddress: false,
  },
  local_delivery: {
    label: "Antar Area Banjarnegara",
    hint: "Diantar kurir kebun, ongkir dikonfirmasi via WA.",
    needsAddress: true,
  },
  shipping_vacuum: {
    label: "Kirim Luar Kota (Vacuum)",
    hint: "Dikemas vacuum + es gel, via ekspedisi kilat.",
    needsAddress: true,
  },
};

export const BUTIR_SIZES: ReadonlyArray<{
  id: ButirSize;
  label: string;
  weightFactor: number;
  priceMultiplier: number;
}> = [
  { id: "sedang", label: "Sedang", weightFactor: 1, priceMultiplier: 1 },
  { id: "besar", label: "Besar", weightFactor: 1.38, priceMultiplier: 1.35 },
  { id: "jumbo", label: "Jumbo", weightFactor: 1.78, priceMultiplier: 1.7 },
];

export const BUTIR_PREPARATION_LABEL: Record<ButirPreparation, string> = {
  utuh: "Kirim Utuh",
  kupas: "Minta Dibukakan / Kupas Rapi",
};

export const GRAM_PACKAGING_META: Record<GramPackaging, { label: string; hint: string; surcharge: number }> = {
  thinwall: { label: "Thinwall Box Segar", hint: "Untuk santap hari ini", surcharge: 0 },
  vacuum: { label: "Vacuum Pack", hint: "Tahan kirim luar kota", surcharge: 5000 },
};

export const GRAM_PRESETS = [250, 500, 750, 1000] as const;
export const GRAM_STEP = 50;

export const LOW_STOCK_BUTIR = 5;
export const LOW_STOCK_GRAM = 1000;

export const PRODUCT_IMAGE_BUCKET = "product-images";
