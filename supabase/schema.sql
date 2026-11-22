-- =============================================================================
--  AgungDurian — Supabase schema (idempotent)
--  Jalankan di Supabase Dashboard → SQL Editor. Aman dijalankan berulang kali.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Enum types
-- -----------------------------------------------------------------------------
do $$ begin
  create type public.harvest_status as enum ('panen_raya', 'stok_terbatas', 'pre_order');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum ('pending', 'confirmed', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.variety_category as enum ('lokal', 'premium', 'kupas');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.delivery_method as enum ('pickup', 'local_delivery', 'shipping_vacuum');
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- Helper: updated_at trigger
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- store_settings (single-row config)
-- -----------------------------------------------------------------------------
create table if not exists public.store_settings (
  id                   smallint primary key default 1 check (id = 1),
  store_name           text not null default 'AgungDurian',
  tagline              text not null default 'Durian Matang Pohon dari Kebun Sigaluh',
  whatsapp_number      text not null default '6281391094308' check (whatsapp_number ~ '^62[0-9]{8,13}$'),
  instagram_handle     text not null default 'agungdurian.sigaluh',
  address              text not null default 'Karangmangu, Kec. Sigaluh, Kab. Banjarnegara, Jawa Tengah 53481',
  maps_url             text not null default 'https://maps.google.com/?q=Durian+Pak+Agung+Karangmangu+Sigaluh+Banjarnegara',
  opening_hours        text not null default 'Setiap hari · 07.00 – 21.00 WIB',
  harvest_status       public.harvest_status not null default 'panen_raya',
  harvest_banner_text  text not null default 'Panen raya minggu ini — durian jatuhan segar setiap pagi.',
  marquee_items        text[] not null default array[]::text[],
  hero_headline        text not null default 'Durian matang pohon, dipetik dengan sabar.',
  hero_subheadline     text not null default '',
  google_rating        numeric(2,1) not null default 4.7 check (google_rating between 0 and 5),
  google_review_count  integer not null default 33 check (google_review_count >= 0),
  updated_at           timestamptz not null default now()
);

drop trigger if exists trg_store_settings_updated on public.store_settings;
create trigger trg_store_settings_updated
  before update on public.store_settings
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- products
-- -----------------------------------------------------------------------------
create table if not exists public.products (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name              text not null check (char_length(name) between 2 and 120),
  variety_category  public.variety_category not null default 'lokal',
  description       text not null default '',
  origin_notes      text not null default '',
  image_url         text,
  -- Mode per butir (utuh)
  allow_butir       boolean not null default true,
  price_butir       integer not null default 0 check (price_butir >= 0),
  avg_weight_kg     numeric(4,2) not null default 2.0 check (avg_weight_kg > 0),
  stock_butir       integer not null default 0 check (stock_butir >= 0),
  -- Mode per gram (kupas)
  allow_gram        boolean not null default false,
  price_per_100g    integer not null default 0 check (price_per_100g >= 0),
  stock_gram        integer not null default 0 check (stock_gram >= 0),
  min_gram          integer not null default 250 check (min_gram >= 50),
  max_gram          integer not null default 2000 check (max_gram >= 100),
  -- Taste profile 1–5
  taste_sweet       smallint not null default 3 check (taste_sweet between 1 and 5),
  taste_creamy      smallint not null default 3 check (taste_creamy between 1 and 5),
  taste_bitter      smallint not null default 2 check (taste_bitter between 1 and 5),
  taste_thickness   smallint not null default 3 check (taste_thickness between 1 and 5),
  badge             text,
  is_featured       boolean not null default false,
  is_active         boolean not null default true,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint products_mode_chk check (allow_butir or allow_gram),
  constraint products_gram_range_chk check (max_gram >= min_gram)
);

create index if not exists idx_products_active on public.products (is_active, sort_order);
create index if not exists idx_products_category on public.products (variety_category);

drop trigger if exists trg_products_updated on public.products;
create trigger trg_products_updated
  before update on public.products
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- orders
-- -----------------------------------------------------------------------------
create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  order_code        text not null unique check (order_code ~ '^AGD-[0-9]{8}-[A-Z0-9]{4}$'),
  customer_name     text not null check (char_length(customer_name) between 2 and 80),
  customer_phone    text not null check (customer_phone ~ '^62[0-9]{8,13}$'),
  delivery_method   public.delivery_method not null,
  delivery_address  text,
  notes             text,
  items_json        jsonb not null check (jsonb_typeof(items_json) = 'array' and jsonb_array_length(items_json) > 0),
  total_amount      integer not null check (total_amount >= 0),
  status            public.order_status not null default 'pending',
  stock_deducted    boolean not null default false,
  created_at        timestamptz not null default now()
);

create index if not exists idx_orders_created on public.orders (created_at desc);
create index if not exists idx_orders_status on public.orders (status);

-- -----------------------------------------------------------------------------
-- testimonials
-- -----------------------------------------------------------------------------
create table if not exists public.testimonials (
  id                 uuid primary key default gen_random_uuid(),
  customer_name      text not null check (char_length(customer_name) between 2 and 80),
  origin_city        text not null default '',
  rating             smallint not null default 5 check (rating between 1 and 5),
  comment            text not null check (char_length(comment) between 5 and 600),
  purchased_variant  text,
  is_visible         boolean not null default true,
  created_at         timestamptz not null default now()
);

create index if not exists idx_testimonials_visible on public.testimonials (is_visible, created_at desc);

-- -----------------------------------------------------------------------------
-- Atomic stock deduction / restoration
--   Mengurangi stok sesuai items_json dalam SATU transaksi dengan row lock.
--   Gagal (rollback total) bila salah satu stok tidak mencukupi.
-- -----------------------------------------------------------------------------
create or replace function public.apply_order_stock(p_order_id uuid, p_direction text default 'deduct')
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_order  public.orders%rowtype;
  v_item   jsonb;
  v_sign   integer;
  v_qty    integer;
  v_prod   public.products%rowtype;
begin
  if p_direction not in ('deduct', 'restore') then
    raise exception 'Arah stok tidak valid: %', p_direction;
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Pesanan tidak ditemukan';
  end if;

  if p_direction = 'deduct' and v_order.stock_deducted then
    return; -- idempotent
  end if;
  if p_direction = 'restore' and not v_order.stock_deducted then
    return;
  end if;

  v_sign := case when p_direction = 'deduct' then -1 else 1 end;

  for v_item in select * from jsonb_array_elements(v_order.items_json)
  loop
    select * into v_prod from public.products
      where id = (v_item->>'product_id')::uuid
      for update;

    if not found then
      raise exception 'Produk % sudah tidak tersedia', coalesce(v_item->>'product_name', '?');
    end if;

    if v_item->>'mode' = 'butir' then
      v_qty := (v_item->>'quantity')::integer;
      if v_sign < 0 and v_prod.stock_butir < v_qty then
        raise exception 'Stok butir % tidak cukup (sisa %, butuh %)', v_prod.name, v_prod.stock_butir, v_qty;
      end if;
      update public.products set stock_butir = stock_butir + (v_sign * v_qty) where id = v_prod.id;
    else
      v_qty := (v_item->>'grams')::integer * (v_item->>'quantity')::integer;
      if v_sign < 0 and v_prod.stock_gram < v_qty then
        raise exception 'Stok gram % tidak cukup (sisa %g, butuh %g)', v_prod.name, v_prod.stock_gram, v_qty;
      end if;
      update public.products set stock_gram = stock_gram + (v_sign * v_qty) where id = v_prod.id;
    end if;
  end loop;

  update public.orders set stock_deducted = (p_direction = 'deduct') where id = p_order_id;
end;
$$;

revoke all on function public.apply_order_stock(uuid, text) from public, anon;
grant execute on function public.apply_order_stock(uuid, text) to authenticated;

-- -----------------------------------------------------------------------------
-- Atomic order status transition (status + stok dalam satu transaksi)
--   pending  → confirmed/completed : kurangi stok (jika p_deduct = true)
--   apa pun  → cancelled           : kembalikan stok bila sebelumnya sudah dipotong
-- -----------------------------------------------------------------------------
create or replace function public.transition_order_status(
  p_order_id uuid,
  p_status   public.order_status,
  p_deduct   boolean default true
)
returns public.orders
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Pesanan tidak ditemukan';
  end if;

  if p_status in ('confirmed', 'completed') and p_deduct and not v_order.stock_deducted then
    perform public.apply_order_stock(p_order_id, 'deduct');
  elsif p_status in ('cancelled', 'pending') and v_order.stock_deducted then
    perform public.apply_order_stock(p_order_id, 'restore');
  end if;

  update public.orders set status = p_status where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

revoke all on function public.transition_order_status(uuid, public.order_status, boolean) from public, anon;
grant execute on function public.transition_order_status(uuid, public.order_status, boolean) to authenticated;

-- -----------------------------------------------------------------------------
-- Atomic inline stock stepper (admin table +/-), never below zero
-- -----------------------------------------------------------------------------
create or replace function public.adjust_product_stock(
  p_product_id uuid,
  p_field      text,
  p_delta      integer
)
returns public.products
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_prod public.products%rowtype;
begin
  if p_field = 'stock_butir' then
    update public.products set stock_butir = greatest(0, stock_butir + p_delta)
      where id = p_product_id returning * into v_prod;
  elsif p_field = 'stock_gram' then
    update public.products set stock_gram = greatest(0, stock_gram + p_delta)
      where id = p_product_id returning * into v_prod;
  else
    raise exception 'Kolom stok tidak valid: %', p_field;
  end if;

  if not found then
    raise exception 'Produk tidak ditemukan';
  end if;
  return v_prod;
end;
$$;

revoke all on function public.adjust_product_stock(uuid, text, integer) from public, anon;
grant execute on function public.adjust_product_stock(uuid, text, integer) to authenticated;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.store_settings enable row level security;
alter table public.products       enable row level security;
alter table public.orders         enable row level security;
alter table public.testimonials   enable row level security;

-- store_settings
drop policy if exists "settings_public_read" on public.store_settings;
create policy "settings_public_read" on public.store_settings
  for select to anon, authenticated using (true);

drop policy if exists "settings_admin_all" on public.store_settings;
create policy "settings_admin_all" on public.store_settings
  for all to authenticated using (true) with check (true);

-- products
drop policy if exists "products_public_read_active" on public.products;
create policy "products_public_read_active" on public.products
  for select to anon using (is_active = true);

drop policy if exists "products_admin_all" on public.products;
create policy "products_admin_all" on public.products
  for all to authenticated using (true) with check (true);

-- orders: publik hanya boleh INSERT pesanan baru berstatus pending
drop policy if exists "orders_public_insert" on public.orders;
create policy "orders_public_insert" on public.orders
  for insert to anon
  with check (status = 'pending' and stock_deducted = false);

drop policy if exists "orders_admin_all" on public.orders;
create policy "orders_admin_all" on public.orders
  for all to authenticated using (true) with check (true);

-- testimonials
drop policy if exists "testimonials_public_read_visible" on public.testimonials;
create policy "testimonials_public_read_visible" on public.testimonials
  for select to anon using (is_visible = true);

drop policy if exists "testimonials_admin_all" on public.testimonials;
create policy "testimonials_admin_all" on public.testimonials
  for all to authenticated using (true) with check (true);

-- Grants (Supabase biasanya sudah memberikan ini; dibuat eksplisit agar jelas)
grant usage on schema public to anon, authenticated;
grant select on public.store_settings, public.products, public.testimonials to anon;
grant insert on public.orders to anon;
grant all on public.store_settings, public.products, public.orders, public.testimonials to authenticated;

-- -----------------------------------------------------------------------------
-- Storage: bucket gambar produk
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'product-images');

drop policy if exists "product_images_admin_insert" on storage.objects;
create policy "product_images_admin_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images');

drop policy if exists "product_images_admin_update" on storage.objects;
create policy "product_images_admin_update" on storage.objects
  for update to authenticated using (bucket_id = 'product-images') with check (bucket_id = 'product-images');

drop policy if exists "product_images_admin_delete" on storage.objects;
create policy "product_images_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images');
