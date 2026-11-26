-- =============================================================================
--  AgungDurian — Seed data (idempotent; aman dijalankan ulang)
--  Jalankan SETELAH schema.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- store_settings
-- -----------------------------------------------------------------------------
insert into public.store_settings (
  id, store_name, tagline, whatsapp_number, instagram_handle, address, maps_url,
  opening_hours, harvest_status, harvest_banner_text, marquee_items,
  hero_headline, hero_subheadline, google_rating, google_review_count,
  hero_image_url, og_image_url, hero_badge_text, cta_primary_text, footer_description,
  why_items_json,
  payment_dana_enabled, payment_dana_number, payment_dana_holder, payment_dana_instructions,
  payment_cod_enabled, payment_cod_notes, payment_pickup_enabled, payment_pickup_notes
) values (
  1,
  'AgungDurian',
  'Durian Pak Agung · Matang Pohon dari Kebun Sigaluh',
  '6281391094308',
  'agungdurian.sigaluh',
  'Karangmangu, Kec. Sigaluh, Kab. Banjarnegara, Jawa Tengah 53481',
  'https://www.google.com/maps/search/?api=1&query=Durian+Pak+Agung+Karangmangu+Sigaluh+Banjarnegara',
  'Setiap hari · 07.00 – 21.00 WIB',
  'panen_raya',
  'Panen raya sedang berlangsung — durian jatuhan segar tiba setiap pagi dari kebun Sigaluh.',
  array[
    'Durian Lokal Super Sigaluh',
    'Garansi ganti baru jika hambar',
    'Bawor Kaki Tiga',
    'Timbangan digital jujur',
    'Montong Emas',
    'Kirim vacuum ke luar kota',
    'Musang King Premium',
    'Makan di tempat · COD · Antar',
    'Duri Hitam (Ochee)',
    'Matang pohon, bukan peraman'
  ],
  'Durian matang pohon, dipetik dengan sabar dari lereng Sigaluh.',
  'Setiap buah jatuh sendiri saat benar-benar matang — legit, wangi, dan bergaransi manis. Beli per butir utuh atau per gram daging kupas, langsung dari kebun Pak Agung.',
  4.7,
  33,
  '/images/hero.webp',
  '/images/og-image.jpg',
  'Kebun Sigaluh',
  'Jelajahi Katalog Panen',
  'Kebun durian keluarga di lereng Sigaluh. Hanya menjual buah jatuhan matang pohon dengan garansi ganti baru bila hambar atau mentah.',
  '[
    {"title":"Garansi ganti baru jika hambar atau mengkal.","description":"Makan langsung di kebun atau kirim ke rumah — bila ada buah yang kurang matang, berair, atau hambar, langsung kami tukar baru tanpa drama.","badge":"Komitmen Utama","icon":"shield"},
    {"title":"Matang pohon, bukan peraman.","description":"Buah diikat tali pengaman di dahan lereng Sigaluh dan baru dipungut setelah jatuh alami. Rasa legit dan aromanya jauh lebih dalam.","badge":"Panen harian · ±480 mdpl","icon":"sprout"},
    {"title":"Timbangan digital jujur.","description":"Baik beli per butir utuh maupun daging kupas per gram, semuanya ditimbang terbuka dengan timbangan digital terkalibrasi.","badge":"Presisi kelipatan 50g","icon":"scale"},
    {"title":"Santap di saung, COD Banjarnegara, atau kirim Vacuum.","description":"Nikmati langsung di kebun Karangmangu, pesan antar area Banjarnegara & sekitar, atau kirim luar kota dengan kemasan Vacuum Pack + ice gel.","badge":"Ambil · COD · Vacuum","icon":"truck"}
  ]'::jsonb,
  true,
  '081391094308',
  'Durian Pak Agung',
  'Transfer sesuai total pesanan ke nomor DANA di atas, lalu unggah screenshot/foto bukti transfer agar pesanan segera disetujui admin.',
  true,
  'Bayar tunai langsung saat kurir tiba (area Banjarnegara & sekitar).',
  true,
  'Ambil langsung di lapak Karangmangu, Sigaluh. Bisa pilih & cicipi di tempat.'
)
on conflict (id) do update set
  store_name                = excluded.store_name,
  tagline                   = excluded.tagline,
  whatsapp_number           = excluded.whatsapp_number,
  instagram_handle          = excluded.instagram_handle,
  address                   = excluded.address,
  maps_url                  = excluded.maps_url,
  opening_hours             = excluded.opening_hours,
  harvest_status            = excluded.harvest_status,
  harvest_banner_text       = excluded.harvest_banner_text,
  marquee_items             = excluded.marquee_items,
  hero_headline             = excluded.hero_headline,
  hero_subheadline          = excluded.hero_subheadline,
  google_rating             = excluded.google_rating,
  google_review_count       = excluded.google_review_count,
  hero_image_url            = excluded.hero_image_url,
  og_image_url              = excluded.og_image_url,
  hero_badge_text           = excluded.hero_badge_text,
  cta_primary_text          = excluded.cta_primary_text,
  footer_description        = excluded.footer_description,
  why_items_json            = excluded.why_items_json,
  payment_dana_enabled      = excluded.payment_dana_enabled,
  payment_dana_number       = excluded.payment_dana_number,
  payment_dana_holder       = excluded.payment_dana_holder,
  payment_dana_instructions = excluded.payment_dana_instructions,
  payment_cod_enabled       = excluded.payment_cod_enabled,
  payment_cod_notes         = excluded.payment_cod_notes,
  payment_pickup_enabled    = excluded.payment_pickup_enabled,
  payment_pickup_notes      = excluded.payment_pickup_notes;

-- -----------------------------------------------------------------------------
-- products
-- -----------------------------------------------------------------------------
insert into public.products (
  slug, name, variety_category, description, origin_notes, image_url,
  allow_butir, price_butir, avg_weight_kg, stock_butir,
  allow_gram, price_per_100g, stock_gram, min_gram, max_gram,
  taste_sweet, taste_creamy, taste_bitter, taste_thickness,
  badge, is_featured, is_active, sort_order
) values
(
  'durian-lokal-super-sigaluh', 'Durian Lokal Super Sigaluh', 'lokal',
  'Primadona kebun kami. Perpaduan manis dan pahit yang seimbang, daging kuning pucat yang lembut, dan aroma khas durian lereng Dieng yang bikin rindu.',
  'Dipetik dari pohon-pohon tua berusia 30+ tahun di Karangmangu, Sigaluh. Hanya buah jatuhan matang pohon yang kami jual.',
  '/images/products/lokal-sigaluh.webp',
  true, 85000, 1.80, 24,
  true, 9500, 6500, 250, 2000,
  4, 4, 3, 3,
  'Unggulan Kebun', true, true, 1
),
(
  'durian-bawor-kaki-tiga', 'Durian Bawor Kaki Tiga', 'premium',
  'Varietas kebanggaan Banyumas Raya. Daging oranye tebal, biji kecil (sering kempes), tekstur super legit seperti dodol yang lumer di lidah.',
  'Dari pohon okulasi Bawor generasi ketiga di blok atas kebun. Panen terbatas, biasanya habis sebelum siang.',
  '/images/products/bawor.webp',
  true, 175000, 2.50, 9,
  true, 16500, 3500, 250, 1500,
  5, 5, 2, 5,
  'Terlaris', true, true, 2
),
(
  'durian-montong-emas', 'Durian Montong Emas', 'premium',
  'Manis pekat dengan daging tebal berwarna emas pucat. Ukurannya jumbo dan juring dagingnya besar-besar — cocok dibeli utuh untuk keluarga atau kupasan.',
  'Montong yang beradaptasi di tanah vulkanis Banjarnegara menghasilkan rasa lebih pekat dibanding montong dataran rendah.',
  '/images/products/montong.webp',
  true, 150000, 3.20, 12,
  true, 12500, 5000, 250, 2000,
  5, 3, 1, 5,
  'Ukuran Jumbo', false, true, 3
),
(
  'durian-musang-king-premium', 'Durian Musang King Premium', 'premium',
  'Raja durian. Daging kuning kunyit yang creamy seperti mentega, rasa manis-pahit yang dalam, dan aroma tajam yang memikat para pencinta sejati.',
  'Dirawat khusus di petak teduh kebun Sigaluh dengan pemupukan organik. Setiap buah dicek kematangannya satu per satu.',
  '/images/products/musang-king.webp',
  true, 325000, 1.90, 5,
  true, 27500, 1800, 250, 1000,
  4, 5, 4, 4,
  'Premium', true, true, 4
),
(
  'durian-duri-hitam-ochee', 'Durian Duri Hitam (Ochee)', 'premium',
  'Eksklusif dan langka. Rasa kompleks berlapis — manis karamel di awal, creamy di tengah, ditutup pahit halus yang elegan. Untuk penikmat durian tingkat lanjut.',
  'Hanya beberapa pohon Ochee yang berbuah di kebun kami setiap musim. Stok sangat terbatas.',
  '/images/products/duri-hitam.webp',
  true, 425000, 1.70, 3,
  true, 35000, 900, 250, 750,
  4, 5, 5, 4,
  'Eksklusif', false, true, 5
),
(
  'durian-kupas-box-spesial-sigaluh', 'Durian Kupas Box Spesial Sigaluh', 'kupas',
  'Daging durian pilihan yang sudah dikupas rapi dan siap santap. Pilih gramasi sesuai selera — praktis untuk oleh-oleh, hampers, atau camilan keluarga.',
  'Dikupas di hari yang sama dengan pengiriman dari campuran durian lokal super terbaik hari itu.',
  '/images/products/kupas-box.webp',
  false, 0, 1.00, 0,
  true, 8500, 8000, 250, 3000,
  4, 4, 2, 3,
  'Siap Santap', true, true, 6
)
on conflict (slug) do update set
  name             = excluded.name,
  variety_category = excluded.variety_category,
  description      = excluded.description,
  origin_notes     = excluded.origin_notes,
  image_url        = excluded.image_url,
  allow_butir      = excluded.allow_butir,
  price_butir      = excluded.price_butir,
  avg_weight_kg    = excluded.avg_weight_kg,
  stock_butir      = excluded.stock_butir,
  allow_gram       = excluded.allow_gram,
  price_per_100g   = excluded.price_per_100g,
  stock_gram       = excluded.stock_gram,
  min_gram         = excluded.min_gram,
  max_gram         = excluded.max_gram,
  taste_sweet      = excluded.taste_sweet,
  taste_creamy     = excluded.taste_creamy,
  taste_bitter     = excluded.taste_bitter,
  taste_thickness  = excluded.taste_thickness,
  badge            = excluded.badge,
  is_featured      = excluded.is_featured,
  is_active        = excluded.is_active,
  sort_order       = excluded.sort_order;

-- -----------------------------------------------------------------------------
-- testimonials (hapus seed lama berdasarkan nama agar tidak dobel)
-- -----------------------------------------------------------------------------
delete from public.testimonials
where customer_name in ('Rina Kusumawati', 'Bagus Prasetyo', 'Dewi Anggraeni', 'Hendra Wijaya');

insert into public.testimonials (customer_name, origin_city, rating, comment, purchased_variant, is_visible) values
('Rina Kusumawati', 'Purwokerto', 5,
 'Bawornya benar-benar legit, dagingnya tebal dan bijinya kecil. Pak Agung sendiri yang pilihkan buahnya, dibukakan di tempat dan semuanya manis. Pasti balik lagi musim depan!',
 'Durian Bawor Kaki Tiga · 2 butir', true),
('Bagus Prasetyo', 'Semarang', 5,
 'Pesan 1 kg kupas vacuum untuk dikirim ke Semarang. Sampai masih dingin, aroma tetap wangi, rasanya seperti makan langsung di kebun. Packing-nya rapi sekali.',
 'Durian Kupas Box · 1000g Vacuum', true),
('Dewi Anggraeni', 'Wonosobo', 5,
 'Suka banget sama lokal super-nya, pahitnya pas dan creamy. Timbangannya juga jujur, ditimbang di depan kita pakai timbangan digital.',
 'Durian Lokal Super Sigaluh · 3 butir', true),
('Hendra Wijaya', 'Yogyakarta', 4,
 'Musang King-nya creamy dan wangi, kualitas setara yang di Malaysia. Sempat dapat satu yang kurang matang, langsung diganti baru tanpa ribet. Pelayanannya juara.',
 'Durian Musang King Premium · 500g', true);

-- -----------------------------------------------------------------------------
-- V3 Default Custom Options, Delivery Zones & Promo Vouchers
-- -----------------------------------------------------------------------------
insert into public.custom_options (
  option_type, code, name, description, applies_to, extra_price, price_multiplier, weight_label, badge, is_default, is_active, sort_order
) values
  ('packing', 'thinwall', 'Thinwall Box Segar', 'Kemasan food-grade untuk santap hari ini', 'gram', 0, 1.00, null, 'Gratis', true, true, 1),
  ('packing', 'vacuum', 'Vacuum Pack Tahan Kirim', 'Kedap udara, menjaga aroma & kesegaran', 'gram', 5000, 1.00, null, 'Populer', false, true, 2),
  ('packing', 'styrofoam-ice', 'Box Styrofoam + Ice Gel', 'Tahan dingin hingga 24 jam untuk kirim luar kota', 'both', 25000, 1.00, null, 'Luar Kota', false, true, 3),
  ('packing', 'hampers-bambu', 'Keranjang Hampers Bambu + Pita', 'Kemasan eksklusif siap hadiah & oleh-oleh', 'both', 35000, 1.00, null, 'Hadiah', false, true, 4),
  ('preparation', 'utuh', 'Kirim Utuh (Belum Dibuka)', 'Buah utuh berduri, bisa dibuka sendiri saat santap', 'butir', 0, 1.00, null, 'Gratis', true, true, 1),
  ('preparation', 'kupas', 'Kupas Rapi di Tempat', 'Dibukakan dan ditata rapi di wadah food-grade', 'butir', 0, 1.00, null, 'Praktis', false, true, 2),
  ('preparation', 'kupas-pisah-biji', 'Kupas & Pisah Biji (Daging Saja)', 'Daging durian murni bebas cangkang & biji', 'butir', 10000, 1.00, null, 'Siap Olah', false, true, 3),
  ('butir_grade', 'sedang', 'Sedang', 'Ukuran pas untuk 1-2 orang', 'butir', 0, 1.00, '±1,8 kg', null, true, true, 1),
  ('butir_grade', 'besar', 'Besar', 'Juring lebih penuh untuk keluarga kecil', 'butir', 0, 1.30, '±2,5 kg', 'Favorit', false, true, 2),
  ('butir_grade', 'jumbo', 'Jumbo', 'Buah pilihan terbesar dari panen pagi', 'butir', 0, 1.65, '±3,2 kg', 'Puas', false, true, 3),
  ('category', 'lokal', 'Lokal Sigaluh', 'Durian lokal pilihan dari pohon tua Sigaluh', 'both', 0, 1.00, null, null, true, true, 1),
  ('category', 'premium', 'Premium / Unggulan', 'Bawor, Montong, Musang King & Ochee', 'both', 0, 1.00, null, null, false, true, 2),
  ('category', 'kupas', 'Paket Kupas / Box', 'Daging kupas segar siap santap', 'gram', 0, 1.00, null, null, false, true, 3),
  ('checkout_addon', 'kartu-ucapan', 'Kartu Ucapan Custom', 'Tulis pesan ucapan di catatan pesanan', 'order', 5000, 1.00, null, null, false, true, 1),
  ('checkout_addon', 'extra-ice-gel', 'Extra Ice Gel Pack', 'Tambahan pendingin untuk pengiriman jarak jauh', 'order', 7000, 1.00, null, 'Dingin Ekstra', false, true, 2),
  ('checkout_addon', 'alat-makan', 'Sarung Tangan & Sendok Makan Set', 'Perlengkapan santap praktis & higienis', 'order', 0, 1.00, null, 'Gratis', false, true, 3)
on conflict (option_type, code) do nothing;

insert into public.delivery_zones (name, description, shipping_fee, estimated_time, allow_cod, is_active, sort_order)
select * from (
  values
    ('Kecamatan Sigaluh (Area Kebun)', 'Pengantaran cepat sekitar Karangmangu & Sigaluh', 0, '30–60 menit', true, true, 1),
    ('Banjarnegara Kota & Sekitarnya', 'Kurir langsung dari kebun ke alamat rumah', 10000, '1–2 jam', true, true, 2),
    ('Purbalingga / Wonosobo / Purwokerto', 'Kurir antar kota / travel sore hari', 25000, 'Hari yang sama', false, true, 3),
    ('Kirim Luar Kota (Express Cold Pack)', 'Pengiriman kilat seluruh Jawa dengan es gel', 45000, '1 hari sampai', false, true, 4)
) as v(name, description, shipping_fee, estimated_time, allow_cod, is_active, sort_order)
where not exists (select 1 from public.delivery_zones);

insert into public.promo_vouchers (code, description, discount_type, discount_value, max_discount, min_subtotal, usage_limit, is_active)
values
  ('SIGALUH10', 'Diskon 10% (maks. Rp30.000) untuk belanja minimal Rp100.000', 'percent', 10, 30000, 100000, null, true),
  ('PANENRAYA', 'Potongan langsung Rp15.000 untuk belanja minimal Rp150.000', 'fixed', 15000, null, 150000, null, true)
on conflict (code) do nothing;
