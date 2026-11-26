-- =============================================================================
--  AgungDurian V3 — Data-Driven Custom Options Engine Migration (Idempotent)
--  Jalankan di Supabase Dashboard → SQL Editor. Aman dijalankan berulang kali.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Allow custom categories on products (convert enum → text)
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'variety_category' and data_type = 'USER-DEFINED'
  ) then
    alter table public.products alter column variety_category drop default;
    alter table public.products alter column variety_category type text using variety_category::text;
    alter table public.products alter column variety_category set default 'lokal';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 2. custom_options (packing, preparation, butir_grade, checkout_addon, category)
-- -----------------------------------------------------------------------------
create table if not exists public.custom_options (
  id                uuid primary key default gen_random_uuid(),
  option_type       text not null check (option_type in ('packing', 'preparation', 'butir_grade', 'checkout_addon', 'category')),
  code              text not null check (code ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name              text not null check (char_length(name) between 1 and 100),
  description       text not null default '',
  applies_to        text not null default 'both' check (applies_to in ('butir', 'gram', 'both', 'order')),
  extra_price       integer not null default 0 check (extra_price >= 0),
  price_multiplier  numeric(5,2) not null default 1.00 check (price_multiplier > 0),
  weight_label      text,
  badge             text,
  is_default        boolean not null default false,
  is_active         boolean not null default true,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  unique (option_type, code)
);

create index if not exists idx_custom_options_lookup
  on public.custom_options (option_type, is_active, sort_order);

-- -----------------------------------------------------------------------------
-- 3. delivery_zones
-- -----------------------------------------------------------------------------
create table if not exists public.delivery_zones (
  id              uuid primary key default gen_random_uuid(),
  name            text not null check (char_length(name) between 2 and 100),
  description     text not null default '',
  shipping_fee    integer not null default 0 check (shipping_fee >= 0),
  estimated_time  text not null default '',
  allow_cod       boolean not null default true,
  is_active       boolean not null default true,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now()
);

create index if not exists idx_delivery_zones_active
  on public.delivery_zones (is_active, sort_order);

-- -----------------------------------------------------------------------------
-- 4. promo_vouchers
-- -----------------------------------------------------------------------------
create table if not exists public.promo_vouchers (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique check (code ~ '^[A-Z0-9_-]{3,32}$'),
  description     text not null default '',
  discount_type   text not null check (discount_type in ('percent', 'fixed')),
  discount_value  integer not null check (discount_value > 0),
  max_discount    integer check (max_discount is null or max_discount > 0),
  min_subtotal    integer not null default 0 check (min_subtotal >= 0),
  usage_limit     integer check (usage_limit is null or usage_limit >= 1),
  used_count      integer not null default 0 check (used_count >= 0),
  is_active       boolean not null default true,
  expires_at      timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists idx_promo_vouchers_code
  on public.promo_vouchers (code, is_active);

-- -----------------------------------------------------------------------------
-- 5. Expand store_settings & orders
-- -----------------------------------------------------------------------------
alter table public.store_settings
  add column if not exists gram_presets_json jsonb not null default '[250, 500, 750, 1000]'::jsonb;

alter table public.orders
  add column if not exists subtotal_amount     integer not null default 0,
  add column if not exists addons_json         jsonb not null default '[]'::jsonb,
  add column if not exists addons_total        integer not null default 0,
  add column if not exists delivery_zone_id    uuid,
  add column if not exists delivery_zone_name  text,
  add column if not exists shipping_fee        integer not null default 0,
  add column if not exists voucher_code        text,
  add column if not exists discount_amount     integer not null default 0;

update public.orders
set subtotal_amount = total_amount
where subtotal_amount = 0 and total_amount > 0;

-- -----------------------------------------------------------------------------
-- 6. Update format_public_order & increment_voucher_usage RPC
-- -----------------------------------------------------------------------------
create or replace function public.format_public_order(p_order public.orders)
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object(
    'order_code', p_order.order_code,
    'customer_name', p_order.customer_name,
    'masked_phone', left(p_order.customer_phone, 5) || '****' || right(p_order.customer_phone, 3),
    'delivery_method', p_order.delivery_method,
    'payment_method', p_order.payment_method,
    'payment_status', p_order.payment_status,
    'payment_proof_url', p_order.payment_proof_url,
    'approval_status', p_order.approval_status,
    'status', p_order.status,
    'admin_note', p_order.admin_note,
    'items_json', p_order.items_json,
    'subtotal_amount', p_order.subtotal_amount,
    'addons_json', p_order.addons_json,
    'addons_total', p_order.addons_total,
    'delivery_zone_name', p_order.delivery_zone_name,
    'shipping_fee', p_order.shipping_fee,
    'voucher_code', p_order.voucher_code,
    'discount_amount', p_order.discount_amount,
    'total_amount', p_order.total_amount,
    'status_history_json', p_order.status_history_json,
    'approved_at', p_order.approved_at,
    'created_at', p_order.created_at
  );
$$;

create or replace function public.increment_voucher_usage(p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.promo_vouchers
  set used_count = used_count + 1
  where code = upper(trim(p_code))
    and is_active = true
    and (usage_limit is null or used_count < usage_limit);
end;
$$;

revoke all on function public.increment_voucher_usage(text) from public;
grant execute on function public.increment_voucher_usage(text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 7. Row Level Security (RLS)
-- -----------------------------------------------------------------------------
alter table public.custom_options enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.promo_vouchers enable row level security;

drop policy if exists "custom_options_public_read" on public.custom_options;
create policy "custom_options_public_read" on public.custom_options
  for select to anon using (is_active = true);

drop policy if exists "custom_options_admin_all" on public.custom_options;
create policy "custom_options_admin_all" on public.custom_options
  for all to authenticated using (true) with check (true);

drop policy if exists "delivery_zones_public_read" on public.delivery_zones;
create policy "delivery_zones_public_read" on public.delivery_zones
  for select to anon using (is_active = true);

drop policy if exists "delivery_zones_admin_all" on public.delivery_zones;
create policy "delivery_zones_admin_all" on public.delivery_zones
  for all to authenticated using (true) with check (true);

drop policy if exists "promo_vouchers_public_read" on public.promo_vouchers;
create policy "promo_vouchers_public_read" on public.promo_vouchers
  for select to anon using (is_active = true);

drop policy if exists "promo_vouchers_admin_all" on public.promo_vouchers;
create policy "promo_vouchers_admin_all" on public.promo_vouchers
  for all to authenticated using (true) with check (true);

grant select on public.custom_options, public.delivery_zones, public.promo_vouchers to anon;
grant all on public.custom_options, public.delivery_zones, public.promo_vouchers to authenticated;

-- -----------------------------------------------------------------------------
-- 8. Seed Default Options, Zones & Vouchers (Idempotent)
-- -----------------------------------------------------------------------------
insert into public.custom_options (
  option_type, code, name, description, applies_to, extra_price, price_multiplier, weight_label, badge, is_default, is_active, sort_order
) values
  -- Packing
  ('packing', 'thinwall', 'Thinwall Box Segar', 'Kemasan food-grade untuk santap hari ini', 'gram', 0, 1.00, null, 'Gratis', true, true, 1),
  ('packing', 'vacuum', 'Vacuum Pack Tahan Kirim', 'Kedap udara, menjaga aroma & kesegaran', 'gram', 5000, 1.00, null, 'Populer', false, true, 2),
  ('packing', 'styrofoam-ice', 'Box Styrofoam + Ice Gel', 'Tahan dingin hingga 24 jam untuk kirim luar kota', 'both', 25000, 1.00, null, 'Luar Kota', false, true, 3),
  ('packing', 'hampers-bambu', 'Keranjang Hampers Bambu + Pita', 'Kemasan eksklusif siap hadiah & oleh-oleh', 'both', 35000, 1.00, null, 'Hadiah', false, true, 4),
  -- Preparation
  ('preparation', 'utuh', 'Kirim Utuh (Belum Dibuka)', 'Buah utuh berduri, bisa dibuka sendiri saat santap', 'butir', 0, 1.00, null, 'Gratis', true, true, 1),
  ('preparation', 'kupas', 'Kupas Rapi di Tempat', 'Dibukakan dan ditata rapi di wadah food-grade', 'butir', 0, 1.00, null, 'Praktis', false, true, 2),
  ('preparation', 'kupas-pisah-biji', 'Kupas & Pisah Biji (Daging Saja)', 'Daging durian murni bebas cangkang & biji', 'butir', 10000, 1.00, null, 'Siap Olah', false, true, 3),
  -- Butir Grades
  ('butir_grade', 'sedang', 'Sedang', 'Ukuran pas untuk 1-2 orang', 'butir', 0, 1.00, '±1,8 kg', null, true, true, 1),
  ('butir_grade', 'besar', 'Besar', 'Juring lebih penuh untuk keluarga kecil', 'butir', 0, 1.30, '±2,5 kg', 'Favorit', false, true, 2),
  ('butir_grade', 'jumbo', 'Jumbo', 'Buah pilihan terbesar dari panen pagi', 'butir', 0, 1.65, '±3,2 kg', 'Puas', false, true, 3),
  -- Categories
  ('category', 'lokal', 'Lokal Sigaluh', 'Durian lokal pilihan dari pohon tua Sigaluh', 'both', 0, 1.00, null, null, true, true, 1),
  ('category', 'premium', 'Premium / Unggulan', 'Bawor, Montong, Musang King & Ochee', 'both', 0, 1.00, null, null, false, true, 2),
  ('category', 'kupas', 'Paket Kupas / Box', 'Daging kupas segar siap santap', 'gram', 0, 1.00, null, null, false, true, 3),
  -- Checkout Add-ons
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
