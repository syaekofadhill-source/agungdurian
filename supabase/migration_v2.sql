-- =============================================================================
--  AgungDurian V2 — Idempotent Migration
--  Jalankan di Supabase Dashboard → SQL Editor (aman dijalankan ulang).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Expand store_settings (Media, Page Copy & Payment Config)
-- -----------------------------------------------------------------------------
alter table public.store_settings
  add column if not exists hero_image_url            text not null default '/images/hero.webp',
  add column if not exists logo_image_url            text,
  add column if not exists og_image_url              text not null default '/images/og-image.jpg',
  add column if not exists story_image_url           text,
  add column if not exists location_image_url        text,
  add column if not exists dana_qr_image_url         text,
  add column if not exists hero_badge_text           text not null default 'Kebun Sigaluh',
  add column if not exists cta_primary_text          text not null default 'Jelajahi Katalog Panen',
  add column if not exists footer_description        text not null default 'Kebun durian keluarga di lereng Sigaluh. Hanya menjual buah jatuhan matang pohon dengan garansi ganti baru bila hambar atau mentah.',
  add column if not exists why_items_json            jsonb not null default '[
    {"title":"Garansi ganti baru jika hambar atau mengkal.","description":"Makan langsung di kebun atau kirim ke rumah — bila ada buah yang kurang matang, berair, atau hambar, langsung kami tukar baru tanpa drama.","badge":"Komitmen Utama","icon":"shield"},
    {"title":"Matang pohon, bukan peraman.","description":"Buah diikat tali pengaman di dahan lereng Sigaluh dan baru dipungut setelah jatuh alami. Rasa legit dan aromanya jauh lebih dalam.","badge":"Panen harian · ±480 mdpl","icon":"sprout"},
    {"title":"Timbangan digital jujur.","description":"Baik beli per butir utuh maupun daging kupas per gram, semuanya ditimbang terbuka dengan timbangan digital terkalibrasi.","badge":"Presisi kelipatan 50g","icon":"scale"},
    {"title":"Santap di saung, COD Banjarnegara, atau kirim Vacuum.","description":"Nikmati langsung di kebun Karangmangu, pesan antar area Banjarnegara & sekitar, atau kirim luar kota dengan kemasan Vacuum Pack + ice gel.","badge":"Ambil · COD · Vacuum","icon":"truck"}
  ]'::jsonb,
  add column if not exists payment_dana_enabled      boolean not null default true,
  add column if not exists payment_dana_number       text not null default '081391094308',
  add column if not exists payment_dana_holder       text not null default 'Durian Pak Agung',
  add column if not exists payment_dana_instructions text not null default 'Transfer sesuai total pesanan ke nomor DANA di atas, lalu unggah screenshot/foto bukti transfer agar pesanan segera disetujui admin.',
  add column if not exists payment_cod_enabled       boolean not null default true,
  add column if not exists payment_cod_notes         text not null default 'Bayar tunai langsung saat kurir tiba (area Banjarnegara & sekitar).',
  add column if not exists payment_pickup_enabled    boolean not null default true,
  add column if not exists payment_pickup_notes      text not null default 'Ambil langsung di lapak Karangmangu, Sigaluh. Bisa pilih & cicipi di tempat.';

-- -----------------------------------------------------------------------------
-- 2. Upgrade orders table (Payment, Approval Lifecycle & History)
-- -----------------------------------------------------------------------------
drop policy if exists "orders_public_insert" on public.orders;
drop function if exists public.transition_order_status(uuid, public.order_status, boolean);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'status' and data_type = 'USER-DEFINED'
  ) then
    alter table public.orders alter column status drop default;
    alter table public.orders alter column status type text using status::text;
  end if;
end $$;

update public.orders set status = 'pending_approval' where status = 'pending';
update public.orders set status = 'approved' where status = 'confirmed';

alter table public.orders
  add column if not exists payment_method      text not null default 'ambil_di_tempat',
  add column if not exists payment_status      text not null default 'unpaid',
  add column if not exists payment_proof_url   text,
  add column if not exists approval_status     text not null default 'pending_approval',
  add column if not exists admin_note          text,
  add column if not exists approved_at         timestamptz,
  add column if not exists approved_by         text,
  add column if not exists status_history_json jsonb not null default '[]'::jsonb;

update public.orders
set approval_status = 'approved'
where status in ('approved', 'preparing', 'ready_or_shipping', 'completed')
  and approval_status = 'pending_approval';

alter table public.orders alter column status set default 'pending_approval';

alter table public.orders drop constraint if exists orders_status_chk;
alter table public.orders add constraint orders_status_chk
  check (status in ('pending_approval', 'approved', 'preparing', 'ready_or_shipping', 'completed', 'rejected', 'cancelled'));

alter table public.orders drop constraint if exists orders_payment_method_chk;
alter table public.orders add constraint orders_payment_method_chk
  check (payment_method in ('dana', 'cod', 'ambil_di_tempat'));

alter table public.orders drop constraint if exists orders_payment_status_chk;
alter table public.orders add constraint orders_payment_status_chk
  check (payment_status in ('unpaid', 'waiting_verification', 'paid', 'rejected'));

alter table public.orders drop constraint if exists orders_approval_status_chk;
alter table public.orders add constraint orders_approval_status_chk
  check (approval_status in ('pending_approval', 'approved', 'rejected'));

create index if not exists idx_orders_approval_status on public.orders (approval_status, created_at desc);
create index if not exists idx_orders_customer_phone on public.orders (customer_phone, created_at desc);

create policy "orders_public_insert" on public.orders
  for insert to anon
  with check (
    status = 'pending_approval'
    and approval_status = 'pending_approval'
    and stock_deducted = false
    and payment_status in ('unpaid', 'waiting_verification')
  );

-- -----------------------------------------------------------------------------
-- 3. Public safe order lookup, tracking, & proof upload RPCs (SECURITY DEFINER)
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
    'total_amount', p_order.total_amount,
    'status_history_json', p_order.status_history_json,
    'approved_at', p_order.approved_at,
    'created_at', p_order.created_at
  );
$$;

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

-- -----------------------------------------------------------------------------
-- 4. Atomic Admin Approval & Status Transition RPC
-- -----------------------------------------------------------------------------
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
    -- preparing / ready_or_shipping / completed
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
-- 5. Storage Buckets: site-assets & payment-proofs
-- -----------------------------------------------------------------------------
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
