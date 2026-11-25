import type {
  ApprovalStatus,
  ButirPreparation,
  ButirSize,
  DeliveryMethod,
  GramPackaging,
  HarvestStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  VarietyCategory,
  WhyItem,
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

export const ORDER_STATUS_META: Record<OrderStatus, { label: string; short: string; className: string }> = {
  pending_approval: {
    label: "Menunggu Persetujuan",
    short: "Menunggu",
    className: "bg-gold/15 text-[#8a5f00] ring-gold/40",
  },
  approved: {
    label: "Disetujui Admin",
    short: "Disetujui",
    className: "bg-emerald-700/10 text-emerald-800 ring-emerald-700/30",
  },
  preparing: {
    label: "Sedang Disiapkan",
    short: "Disiapkan",
    className: "bg-sky-700/10 text-sky-900 ring-sky-700/30",
  },
  ready_or_shipping: {
    label: "Siap Diambil / Dikirim",
    short: "Siap / Kirim",
    className: "bg-indigo-700/10 text-indigo-900 ring-indigo-700/30",
  },
  completed: {
    label: "Selesai",
    short: "Selesai",
    className: "bg-orchard/10 text-orchard ring-orchard/30",
  },
  rejected: {
    label: "Ditolak Admin",
    short: "Ditolak",
    className: "bg-crimson/10 text-crimson ring-crimson/30",
  },
  cancelled: {
    label: "Dibatalkan",
    short: "Dibatalkan",
    className: "bg-bark/10 text-moss ring-bark/20",
  },
};

export const APPROVAL_STATUS_META: Record<ApprovalStatus, { label: string; className: string }> = {
  pending_approval: { label: "Menunggu Approval", className: "bg-gold/15 text-[#8a5f00] ring-gold/40" },
  approved: { label: "Disetujui", className: "bg-emerald-700/10 text-emerald-800 ring-emerald-700/30" },
  rejected: { label: "Ditolak", className: "bg-crimson/10 text-crimson ring-crimson/30" },
};

export const PAYMENT_METHOD_META: Record<PaymentMethod, { label: string; short: string; badgeClass: string }> = {
  dana: {
    label: "Transfer DANA",
    short: "DANA",
    badgeClass: "bg-sky-600/10 text-sky-900 ring-sky-600/25",
  },
  cod: {
    label: "COD (Bayar di Tempat)",
    short: "COD",
    badgeClass: "bg-amber-600/10 text-[#8a5f00] ring-amber-600/25",
  },
  ambil_di_tempat: {
    label: "Bayar & Ambil di Kebun",
    short: "Ambil di Tempat",
    badgeClass: "bg-orchard/10 text-orchard ring-orchard/20",
  },
};

export const PAYMENT_STATUS_META: Record<PaymentStatus, { label: string; className: string }> = {
  unpaid: { label: "Belum Dibayar", className: "bg-cream-2 text-moss ring-orchard/15" },
  waiting_verification: { label: "Menunggu Verifikasi Bukti", className: "bg-gold/15 text-[#8a5f00] ring-gold/40" },
  paid: { label: "Lunas / Terverifikasi", className: "bg-emerald-700/10 text-emerald-800 ring-emerald-700/30" },
  rejected: { label: "Bukti Ditolak", className: "bg-crimson/10 text-crimson ring-crimson/30" },
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
export const SITE_ASSETS_BUCKET = "site-assets";
export const PAYMENT_PROOFS_BUCKET = "payment-proofs";

export const DEFAULT_WHY_ITEMS: WhyItem[] = [
  {
    title: "Garansi ganti baru jika hambar atau mengkal.",
    description:
      "Makan langsung di kebun atau kirim ke rumah — bila ada buah yang kurang matang, berair, atau hambar, langsung kami tukar baru tanpa drama.",
    badge: "Komitmen Utama",
    icon: "shield",
  },
  {
    title: "Matang pohon, bukan peraman.",
    description:
      "Buah diikat tali pengaman di dahan lereng Sigaluh dan baru dipungut setelah jatuh alami. Rasa legit dan aromanya jauh lebih dalam.",
    badge: "Panen harian · ±480 mdpl",
    icon: "sprout",
  },
  {
    title: "Timbangan digital jujur.",
    description:
      "Baik beli per butir utuh maupun daging kupas per gram, semuanya ditimbang terbuka dengan timbangan digital terkalibrasi.",
    badge: "Presisi kelipatan 50g",
    icon: "scale",
  },
  {
    title: "Santap di saung, COD Banjarnegara, atau kirim Vacuum.",
    description:
      "Nikmati langsung di kebun Karangmangu, pesan antar area Banjarnegara & sekitar, atau kirim luar kota dengan kemasan Vacuum Pack + ice gel.",
    badge: "Ambil · COD · Vacuum",
    icon: "truck",
  },
];
