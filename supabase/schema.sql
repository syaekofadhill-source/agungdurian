-- =============================================================================
--  AgungDurian V2 — Supabase schema (idempotent)
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
-- store_settings (single-row config + V2 media, copy, payment)
-- -----------------------------------------------------------------------------
create table if not exists public.store_settings (
  id                         smallint primary key default 1 check (id = 1),
  store_name                 text not null default 'AgungDurian',
  tagline                    text not null default 'Durian Pak Agung · Matang Pohon dari Kebun Sigaluh',
  whatsapp_number            text not null default '6281391094308' check (whatsapp_number ~ '^62[0-9]{8,13}$'),
  instagram_handle           text not null default 'agungdurian.sigaluh',
  address                    text not null default 'Karangmangu, Kec. Sigaluh, Kab. Banjarnegara, Jawa Tengah 53481',
  maps_url                   text not null default 'https://maps.google.com/?q=Durian+Pak+Agung+Karangmangu+Sigaluh+Banjarnegara',
  opening_hours              text not null default 'Setiap hari · 07.00 – 21.00 WIB',
  harvest_status             public.harvest_status not null default 'panen_raya',
  harvest_banner_text        text not null default 'Panen raya minggu ini — durian jatuhan segar setiap pagi.',
  marquee_items              text[] not null default array[]::text[],
  hero_headline              text not null default 'Durian matang pohon, dipetik dengan sabar.',
  hero_subheadline           text not null default '',
  google_rating              numeric(2,1) not null default 4.7 check (google_rating between 0 and 5),
  google_review_count        integer not null default 33 check (google_review_count >= 0),
  hero_image_url             text not null default '/images/hero.webp',
  logo_image_url             text,
  og_image_url               text not null default '/images/og-image.jpg',
  story_image_url            text,
  location_image_url         text,
  dana_qr_image_url          text,
  hero_badge_text            text not null default 'Kebun Sigaluh',
  cta_primary_text           text not null default 'Jelajahi Katalog Panen',
  footer_description         text not null default 'Kebun durian keluarga di lereng Sigaluh. Hanya menjual buah jatuhan matang pohon dengan garansi ganti baru bila hambar atau mentah.',
  why_items_json             jsonb not null default '[
    {"title":"Garansi ganti baru jika hambar atau mengkal.","description":"Makan langsung di kebun atau kirim ke rumah — bila ada buah yang kurang matang, berair, atau hambar, langsung kami tukar baru tanpa drama.","badge":"Komitmen Utama","icon":"shield"},
    {"title":"Matang pohon, bukan peraman.","description":"Buah diikat tali pengaman di dahan lereng Sigaluh dan baru dipungut setelah jatuh alami. Rasa legit dan aromanya jauh lebih dalam.","badge":"Panen harian · ±480 mdpl","icon":"sprout"},
    {"title":"Timbangan digital jujur.","description":"Baik beli per butir utuh maupun daging kupas per gram, semuanya ditimbang terbuka dengan timbangan digital terkalibrasi.","badge":"Presisi kelipatan 50g","icon":"scale"},
    {"title":"Santap di saung, COD Banjarnegara, atau kirim Vacuum.","description":"Nikmati langsung di kebun Karangmangu, pesan antar area Banjarnegara & sekitar, atau kirim luar kota dengan kemasan Vacuum Pack + ice gel.","badge":"Ambil · COD · Vacuum","icon":"truck"}
  ]'::jsonb,
  payment_dana_enabled       boolean not null default true,
  payment_dana_number        text not null default '081391094308',
  payment_dana_holder        text not null default 'Durian Pak Agung',
  payment_dana_instructions  text not null default 'Transfer sesuai total pesanan ke nomor DANA di atas, lalu unggah screenshot/foto bukti transfer agar pesanan segera disetujui admin.',
  payment_cod_enabled        boolean not null default true,
  payment_cod_notes          text not null default 'Bayar tunai langsung saat kurir tiba (area Banjarnegara & sekitar).',
  payment_pickup_enabled     boolean not null default true,
  payment_pickup_notes       text not null default 'Ambil langsung di lapak Karangmangu, Sigaluh. Bisa pilih & cicipi di tempat.',
  gram_presets_json          jsonb not null default '[250, 500, 750, 1000]'::jsonb,
  updated_at                 timestamptz not null default now()
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
  variety_category  text not null default 'lokal',
  description       text not null default '',
  origin_notes      text not null default '',
  image_url         text,
  allow_butir       boolean not null default true,
  price_butir       integer not null default 0 check (price_butir >= 0),
  avg_weight_kg     numeric(4,2) not null default 2.0 check (avg_weight_kg > 0),
  stock_butir       integer not null default 0 check (stock_butir >= 0),
  allow_gram        boolean not null default false,
  price_per_100g    integer not null default 0 check (price_per_100g >= 0),
  stock_gram        integer not null default 0 check (stock_gram >= 0),
  min_gram          integer not null default 250 check (min_gram >= 50),
  max_gram          integer not null default 2000 check (max_gram >= 100),
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
-- orders (V2 payment & approval lifecycle)
-- -----------------------------------------------------------------------------
create table if not exists public.orders (
  id                   uuid primary key default gen_random_uuid(),
  order_code           text not null unique check (order_code ~ '^AGD-[0-9]{8}-[A-Z0-9]{4}$'),
  customer_name        text not null check (char_length(customer_name) between 2 and 80),
  customer_phone       text not null check (customer_phone ~ '^62[0-9]{8,13}$'),
  delivery_method      public.delivery_method not null,
  delivery_address     text,
  notes                text,
  items_json           jsonb not null check (jsonb_typeof(items_json) = 'array' and jsonb_array_length(items_json) > 0),
  subtotal_amount      integer not null default 0 check (subtotal_amount >= 0),
  addons_json          jsonb not null default '[]'::jsonb,
  addons_total         integer not null default 0 check (addons_total >= 0),
  delivery_zone_id     uuid,
  delivery_zone_name   text,
  shipping_fee         integer not null default 0 check (shipping_fee >= 0),
  voucher_code         text,
  discount_amount      integer not null default 0 check (discount_amount >= 0),
  total_amount         integer not null check (total_amount >= 0),
  payment_method       text not null default 'ambil_di_tempat' constraint orders_payment_method_chk check (payment_method in ('dana', 'cod', 'ambil_di_tempat')),
  payment_status       text not null default 'unpaid' constraint orders_payment_status_chk check (payment_status in ('unpaid', 'waiting_verification', 'paid', 'rejected')),
  payment_proof_url    text,
  approval_status      text not null default 'pending_approval' constraint orders_approval_status_chk check (approval_status in ('pending_approval', 'approved', 'rejected')),
  status               text not null default 'pending_approval' constraint orders_status_chk check (status in ('pending_approval', 'approved', 'preparing', 'ready_or_shipping', 'completed', 'rejected', 'cancelled')),
  admin_note           text,
  approved_at          timestamptz,
  approved_by          text,
  status_history_json  jsonb not null default '[]'::jsonb,
  stock_deducted       boolean not null default false,
  created_at           timestamptz not null default now()
);

create index if not exists idx_orders_created on public.orders (created_at desc);
create index if not exists idx_orders_status on public.orders (status);
create index if not exists idx_orders_approval_status on public.orders (approval_status, created_at desc);
create index if not exists idx_orders_customer_phone on public.orders (customer_phone, created_at desc);

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
    return;
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
-- V3 Custom Options, Delivery Zones & Promo Vouchers
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
-- V2/V3 Public safe order RPCs & Atomic Admin Approval RPC
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

create or replace function public.get_public_order(p_order_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order
  from public.orders
  where upper(order_code) = upper(trim(p_order_code))
  limit 1;

  if not found then
    return null;
  end if;
  return public.format_public_order(v_order);
end;
$$;

revoke all on function public.get_public_order(text) from public;
grant execute on function public.get_public_order(text) to anon, authenticated;

create or replace function public.track_orders_by_query(p_query text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clean text := trim(coalesce(p_query, ''));
  v_digits text;
  v_result jsonb;
begin
  if v_clean ~* '^AGD-[0-9]{8}-[A-Z0-9]{4}$' then
    select coalesce(jsonb_agg(public.format_public_order(o)), '[]'::jsonb) into v_result
    from public.orders o
    where upper(o.order_code) = upper(v_clean);
    return v_result;
  end if;

  v_digits := regexp_replace(v_clean, '\D', '', 'g');
  if left(v_digits, 1) = '0' then
    v_digits := '62' || substr(v_digits, 2);
  elsif left(v_digits, 1) = '8' then
    v_digits := '62' || v_digits;
  end if;

  if length(v_digits) < 10 then
    return '[]'::jsonb;
  end if;

  select coalesce(jsonb_agg(public.format_public_order(sub)), '[]'::jsonb) into v_result
  from (
    select *
    from public.orders
    where customer_phone = v_digits
    order by created_at desc
    limit 10
  ) sub;

  return v_result;
end;
$$;

revoke all on function public.track_orders_by_query(text) from public;
grant execute on function public.track_orders_by_query(text) to anon, authenticated;

create or replace function public.attach_order_payment_proof(
  p_order_code text,
  p_proof_url  text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_entry jsonb;
begin
  select * into v_order
  from public.orders
  where upper(order_code) = upper(trim(p_order_code))
  for update;

  if not found then
    raise exception 'Pesanan tidak ditemukan';
  end if;

  if v_order.payment_method <> 'dana' then
    raise exception 'Pesanan ini tidak menggunakan pembayaran DANA';
  end if;

  if v_order.status in ('completed', 'cancelled') then
    raise exception 'Pesanan sudah selesai atau dibatalkan';
  end if;

  v_entry := jsonb_build_object(
    'status', v_order.status,
    'note', 'Pembeli mengunggah bukti transfer DANA.',
    'timestamp', now(),
    'actor', 'customer'
  );

  update public.orders
  set payment_proof_url = p_proof_url,
      payment_status = 'waiting_verification',
      status_history_json = coalesce(status_history_json, '[]'::jsonb) || jsonb_build_array(v_entry)
  where id = v_order.id
  returning * into v_order;

  return public.format_public_order(v_order);
end;
$$;

revoke all on function public.attach_order_payment_proof(text, text) from public;
grant execute on function public.attach_order_payment_proof(text, text) to anon, authenticated;

create or replace function public.process_order_action(
  p_order_id       uuid,
  p_action         text,
  p_admin_note     text default null,
  p_actor          text default 'admin',
  p_verify_payment boolean default true
)
returns public.orders
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_order   public.orders%rowtype;
  v_note    text := nullif(trim(coalesce(p_admin_note, '')), '');
  v_actor   text := coalesce(nullif(trim(coalesce(p_actor, '')), ''), 'admin');
  v_next    text;
  v_msg     text;
  v_entry   jsonb;
begin
  if p_action not in ('approve', 'reject', 'preparing', 'ready_or_shipping', 'completed', 'cancelled') then
    raise exception 'Aksi pesanan tidak valid: %', p_action;
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Pesanan tidak ditemukan';
  end if;

  if p_action = 'approve' then
    if not v_order.stock_deducted then
      perform public.apply_order_stock(p_order_id, 'deduct');
    end if;
    v_next := 'approved';
    v_msg := coalesce(v_note, 'Pesanan disetujui admin & stok diamankan.');

    update public.orders
    set status = v_next,
        approval_status = 'approved',
        admin_note = coalesce(v_note, admin_note),
        approved_at = now(),
        approved_by = v_actor,
        payment_status = case
          when payment_method = 'dana' and p_verify_payment then 'paid'
          else payment_status
        end,
        status_history_json = coalesce(status_history_json, '[]'::jsonb) || jsonb_build_array(
          jsonb_build_object('status', v_next, 'note', v_msg, 'timestamp', now(), 'actor', v_actor)
        )
    where id = p_order_id
    returning * into v_order;

    return v_order;
  end if;

  if p_action = 'reject' then
    if v_note is null then
      raise exception 'Alasan penolakan wajib diisi';
    end if;
    if v_order.stock_deducted then
      perform public.apply_order_stock(p_order_id, 'restore');
    end if;
    v_next := 'rejected';

    update public.orders
    set status = v_next,
        approval_status = 'rejected',
        admin_note = v_note,
        payment_status = case when payment_method = 'dana' then 'rejected' else payment_status end,
        status_history_json = coalesce(status_history_json, '[]'::jsonb) || jsonb_build_array(
          jsonb_build_object('status', v_next, 'note', 'Ditolak: ' || v_note, 'timestamp', now(), 'actor', v_actor)
        )
    where id = p_order_id
    returning * into v_order;

    return v_order;
  end if;

  if p_action = 'cancelled' then
    if v_order.stock_deducted then
      perform public.apply_order_stock(p_order_id, 'restore');
    end if;
    v_next := 'cancelled';
    v_msg := coalesce(v_note, 'Pesanan dibatalkan.');
  else
    if not v_order.stock_deducted then
      perform public.apply_order_stock(p_order_id, 'deduct');
    end if;
    v_next := p_action;
    v_msg := coalesce(
      v_note,
      case v_next
        when 'preparing' then 'Pesanan sedang disiapkan & dikemas di kebun.'
        when 'ready_or_shipping' then 'Pesanan siap diambil atau sedang dalam pengantaran.'
        when 'completed' then 'Pesanan selesai diterima pembeli.'
        else 'Status diperbarui.'
      end
    );
  end if;

  v_entry := jsonb_build_object('status', v_next, 'note', v_msg, 'timestamp', now(), 'actor', v_actor);

  update public.orders
  set status = v_next,
      approval_status = case
        when v_next in ('preparing', 'ready_or_shipping', 'completed') and approval_status = 'pending_approval' then 'approved'
        else approval_status
      end,
      approved_at = case
        when v_next in ('preparing', 'ready_or_shipping', 'completed') and approved_at is null then now()
        else approved_at
      end,
      approved_by = case
        when v_next in ('preparing', 'ready_or_shipping', 'completed') and approved_by is null then v_actor
        else approved_by
      end,
      payment_status = case
        when v_next = 'completed' then 'paid'
        else payment_status
      end,
      admin_note = coalesce(v_note, admin_note),
      status_history_json = coalesce(status_history_json, '[]'::jsonb) || jsonb_build_array(v_entry)
  where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

revoke all on function public.process_order_action(uuid, text, text, text, boolean) from public, anon;
grant execute on function public.process_order_action(uuid, text, text, text, boolean) to authenticated;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.store_settings enable row level security;
alter table public.products       enable row level security;
alter table public.orders         enable row level security;
alter table public.testimonials   enable row level security;
alter table public.custom_options enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.promo_vouchers enable row level security;

drop policy if exists "settings_public_read" on public.store_settings;
create policy "settings_public_read" on public.store_settings
  for select to anon, authenticated using (true);

drop policy if exists "settings_admin_all" on public.store_settings;
create policy "settings_admin_all" on public.store_settings
  for all to authenticated using (true) with check (true);

drop policy if exists "products_public_read_active" on public.products;
create policy "products_public_read_active" on public.products
  for select to anon using (is_active = true);

drop policy if exists "products_admin_all" on public.products;
create policy "products_admin_all" on public.products
  for all to authenticated using (true) with check (true);

drop policy if exists "orders_public_insert" on public.orders;
create policy "orders_public_insert" on public.orders
  for insert to anon
  with check (
    status = 'pending_approval'
    and approval_status = 'pending_approval'
    and stock_deducted = false
    and payment_status in ('unpaid', 'waiting_verification')
  );

drop policy if exists "orders_admin_all" on public.orders;
create policy "orders_admin_all" on public.orders
  for all to authenticated using (true) with check (true);

drop policy if exists "testimonials_public_read_visible" on public.testimonials;
create policy "testimonials_public_read_visible" on public.testimonials
  for select to anon using (is_visible = true);

drop policy if exists "testimonials_admin_all" on public.testimonials;
create policy "testimonials_admin_all" on public.testimonials
  for all to authenticated using (true) with check (true);

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

grant usage on schema public to anon, authenticated;
grant select on public.store_settings, public.products, public.testimonials, public.custom_options, public.delivery_zones, public.promo_vouchers to anon;
grant insert on public.orders to anon;
grant all on public.store_settings, public.products, public.orders, public.testimonials, public.custom_options, public.delivery_zones, public.promo_vouchers to authenticated;

-- -----------------------------------------------------------------------------
-- Storage: product-images, site-assets, payment-proofs
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

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-assets', 'site-assets', true, 4194304, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "site_assets_public_read" on storage.objects;
create policy "site_assets_public_read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'site-assets');

drop policy if exists "site_assets_admin_insert" on storage.objects;
create policy "site_assets_admin_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'site-assets');

drop policy if exists "site_assets_admin_update" on storage.objects;
create policy "site_assets_admin_update" on storage.objects
  for update to authenticated using (bucket_id = 'site-assets') with check (bucket_id = 'site-assets');

drop policy if exists "site_assets_admin_delete" on storage.objects;
create policy "site_assets_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'site-assets');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', true, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "payment_proofs_public_read" on storage.objects;
create policy "payment_proofs_public_read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'payment-proofs');

drop policy if exists "payment_proofs_anon_insert" on storage.objects;
create policy "payment_proofs_anon_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'payment-proofs' and name ~ '^AGD-[0-9]{8}-[A-Z0-9]{4}/[0-9]+\.(jpg|jpeg|png|webp)$');

drop policy if exists "payment_proofs_admin_manage" on storage.objects;
create policy "payment_proofs_admin_manage" on storage.objects
  for delete to authenticated using (bucket_id = 'payment-proofs');
