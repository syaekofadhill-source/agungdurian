import type { Order, Product, StoreSettings, Testimonial } from "@/types/database";

/**
 * Typed mirror of `supabase/seed.sql`.
 * Served ONLY when Supabase env vars are missing, so the storefront never
 * white-screens during a first local preview.
 */

const ts = "2026-11-01T07:00:00.000Z";

export const MOCK_SETTINGS: StoreSettings = {
  id: 1,
  store_name: "AgungDurian",
  tagline: "Durian Pak Agung · Matang Pohon dari Kebun Sigaluh",
  whatsapp_number: "6281391094308",
  instagram_handle: "agungdurian.sigaluh",
  address: "Karangmangu, Kec. Sigaluh, Kab. Banjarnegara, Jawa Tengah 53481",
  maps_url:
    "https://www.google.com/maps/search/?api=1&query=Durian+Pak+Agung+Karangmangu+Sigaluh+Banjarnegara",
  opening_hours: "Setiap hari · 07.00 – 21.00 WIB",
  harvest_status: "panen_raya",
  harvest_banner_text:
    "Panen raya sedang berlangsung — durian jatuhan segar tiba setiap pagi dari kebun Sigaluh.",
  marquee_items: [
    "Durian Lokal Super Sigaluh",
    "Garansi ganti baru jika hambar",
    "Bawor Kaki Tiga",
    "Timbangan digital jujur",
    "Montong Emas",
    "Kirim vacuum ke luar kota",
    "Musang King Premium",
    "Makan di tempat · COD · Antar",
    "Duri Hitam (Ochee)",
    "Matang pohon, bukan peraman",
  ],
  hero_headline: "Durian matang pohon, dipetik dengan sabar dari lereng Sigaluh.",
  hero_subheadline:
    "Setiap buah jatuh sendiri saat benar-benar matang — legit, wangi, dan bergaransi manis. Beli per butir utuh atau per gram daging kupas, langsung dari kebun Pak Agung.",
  google_rating: 4.7,
  google_review_count: 33,
  updated_at: ts,
};

type SeedProduct = Omit<Product, "id" | "created_at" | "updated_at">;

const seedProducts: SeedProduct[] = [
  {
    slug: "durian-lokal-super-sigaluh",
    name: "Durian Lokal Super Sigaluh",
    variety_category: "lokal",
    description:
      "Primadona kebun kami. Perpaduan manis dan pahit yang seimbang, daging kuning pucat yang lembut, dan aroma khas durian lereng Dieng yang bikin rindu.",
    origin_notes:
      "Dipetik dari pohon-pohon tua berusia 30+ tahun di Karangmangu, Sigaluh. Hanya buah jatuhan matang pohon yang kami jual.",
    image_url: "/images/products/lokal-sigaluh.webp",
    allow_butir: true,
    price_butir: 85000,
    avg_weight_kg: 1.8,
    stock_butir: 24,
    allow_gram: true,
    price_per_100g: 9500,
    stock_gram: 6500,
    min_gram: 250,
    max_gram: 2000,
    taste_sweet: 4,
    taste_creamy: 4,
    taste_bitter: 3,
    taste_thickness: 3,
    badge: "Unggulan Kebun",
    is_featured: true,
    is_active: true,
    sort_order: 1,
  },
  {
    slug: "durian-bawor-kaki-tiga",
    name: "Durian Bawor Kaki Tiga",
    variety_category: "premium",
    description:
      "Varietas kebanggaan Banyumas Raya. Daging oranye tebal, biji kecil (sering kempes), tekstur super legit seperti dodol yang lumer di lidah.",
    origin_notes:
      "Dari pohon okulasi Bawor generasi ketiga di blok atas kebun. Panen terbatas, biasanya habis sebelum siang.",
    image_url: "/images/products/bawor.webp",
    allow_butir: true,
    price_butir: 175000,
    avg_weight_kg: 2.5,
    stock_butir: 9,
    allow_gram: true,
    price_per_100g: 16500,
    stock_gram: 3500,
    min_gram: 250,
    max_gram: 1500,
    taste_sweet: 5,
    taste_creamy: 5,
    taste_bitter: 2,
    taste_thickness: 5,
    badge: "Terlaris",
    is_featured: true,
    is_active: true,
    sort_order: 2,
  },
  {
    slug: "durian-montong-emas",
    name: "Durian Montong Emas",
    variety_category: "premium",
    description:
      "Manis pekat dengan daging tebal berwarna emas pucat. Ukurannya jumbo dan juring dagingnya besar-besar — cocok dibeli utuh untuk keluarga atau kupasan.",
    origin_notes:
      "Montong yang beradaptasi di tanah vulkanis Banjarnegara menghasilkan rasa lebih pekat dibanding montong dataran rendah.",
    image_url: "/images/products/montong.webp",
    allow_butir: true,
    price_butir: 150000,
    avg_weight_kg: 3.2,
    stock_butir: 12,
    allow_gram: true,
    price_per_100g: 12500,
    stock_gram: 5000,
    min_gram: 250,
    max_gram: 2000,
    taste_sweet: 5,
    taste_creamy: 3,
    taste_bitter: 1,
    taste_thickness: 5,
    badge: "Ukuran Jumbo",
    is_featured: false,
    is_active: true,
    sort_order: 3,
  },
  {
    slug: "durian-musang-king-premium",
    name: "Durian Musang King Premium",
    variety_category: "premium",
    description:
      "Raja durian. Daging kuning kunyit yang creamy seperti mentega, rasa manis-pahit yang dalam, dan aroma tajam yang memikat para pencinta sejati.",
    origin_notes:
      "Dirawat khusus di petak teduh kebun Sigaluh dengan pemupukan organik. Setiap buah dicek kematangannya satu per satu.",
    image_url: "/images/products/musang-king.webp",
    allow_butir: true,
    price_butir: 325000,
    avg_weight_kg: 1.9,
    stock_butir: 5,
    allow_gram: true,
    price_per_100g: 27500,
    stock_gram: 1800,
    min_gram: 250,
    max_gram: 1000,
    taste_sweet: 4,
    taste_creamy: 5,
    taste_bitter: 4,
    taste_thickness: 4,
    badge: "Premium",
    is_featured: true,
    is_active: true,
    sort_order: 4,
  },
  {
    slug: "durian-duri-hitam-ochee",
    name: "Durian Duri Hitam (Ochee)",
    variety_category: "premium",
    description:
      "Eksklusif dan langka. Rasa kompleks berlapis — manis karamel di awal, creamy di tengah, ditutup pahit halus yang elegan. Untuk penikmat durian tingkat lanjut.",
    origin_notes:
      "Hanya beberapa pohon Ochee yang berbuah di kebun kami setiap musim. Stok sangat terbatas.",
    image_url: "/images/products/duri-hitam.webp",
    allow_butir: true,
    price_butir: 425000,
    avg_weight_kg: 1.7,
    stock_butir: 3,
    allow_gram: true,
    price_per_100g: 35000,
    stock_gram: 900,
    min_gram: 250,
    max_gram: 750,
    taste_sweet: 4,
    taste_creamy: 5,
    taste_bitter: 5,
    taste_thickness: 4,
    badge: "Eksklusif",
    is_featured: false,
    is_active: true,
    sort_order: 5,
  },
  {
    slug: "durian-kupas-box-spesial-sigaluh",
    name: "Durian Kupas Box Spesial Sigaluh",
    variety_category: "kupas",
    description:
      "Daging durian pilihan yang sudah dikupas rapi dan siap santap. Pilih gramasi sesuai selera — praktis untuk oleh-oleh, hampers, atau camilan keluarga.",
    origin_notes:
      "Dikupas di hari yang sama dengan pengiriman dari campuran durian lokal super terbaik hari itu.",
    image_url: "/images/products/kupas-box.webp",
    allow_butir: false,
    price_butir: 0,
    avg_weight_kg: 1,
    stock_butir: 0,
    allow_gram: true,
    price_per_100g: 8500,
    stock_gram: 8000,
    min_gram: 250,
    max_gram: 3000,
    taste_sweet: 4,
    taste_creamy: 4,
    taste_bitter: 2,
    taste_thickness: 3,
    badge: "Siap Santap",
    is_featured: true,
    is_active: true,
    sort_order: 6,
  },
];

export const MOCK_PRODUCTS: Product[] = seedProducts.map((p, i) => ({
  ...p,
  id: `00000000-0000-4000-8000-00000000000${i + 1}`,
  created_at: ts,
  updated_at: ts,
}));

export const MOCK_TESTIMONIALS: Testimonial[] = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    customer_name: "Rina Kusumawati",
    origin_city: "Purwokerto",
    rating: 5,
    comment:
      "Bawornya benar-benar legit, dagingnya tebal dan bijinya kecil. Pak Agung sendiri yang pilihkan buahnya, dibukakan di tempat dan semuanya manis. Pasti balik lagi musim depan!",
    purchased_variant: "Durian Bawor Kaki Tiga · 2 butir",
    is_visible: true,
    created_at: ts,
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    customer_name: "Bagus Prasetyo",
    origin_city: "Semarang",
    rating: 5,
    comment:
      "Pesan 1 kg kupas vacuum untuk dikirim ke Semarang. Sampai masih dingin, aroma tetap wangi, rasanya seperti makan langsung di kebun. Packing-nya rapi sekali.",
    purchased_variant: "Durian Kupas Box · 1000g Vacuum",
    is_visible: true,
    created_at: ts,
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    customer_name: "Dewi Anggraeni",
    origin_city: "Wonosobo",
    rating: 5,
    comment:
      "Suka banget sama lokal super-nya, pahitnya pas dan creamy. Timbangannya juga jujur, ditimbang di depan kita pakai timbangan digital.",
    purchased_variant: "Durian Lokal Super Sigaluh · 3 butir",
    is_visible: true,
    created_at: ts,
  },
  {
    id: "10000000-0000-4000-8000-000000000004",
    customer_name: "Hendra Wijaya",
    origin_city: "Yogyakarta",
    rating: 4,
    comment:
      "Musang King-nya creamy dan wangi, kualitas setara yang di Malaysia. Sempat dapat satu yang kurang matang, langsung diganti baru tanpa ribet. Pelayanannya juara.",
    purchased_variant: "Durian Musang King Premium · 500g",
    is_visible: true,
    created_at: ts,
  },
];

export const MOCK_ORDERS: Order[] = [];
