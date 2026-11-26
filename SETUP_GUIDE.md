# Panduan Setup AgungDurian V3 (E-Commerce, Modular Admin CMS & Custom Options Engine)

Panduan ini menjelaskan langkah demi langkah untuk menyiapkan proyek **AgungDurian** dengan backend **Supabase** (PostgreSQL, Auth, Storage) serta menjalankannya secara lokal maupun produksi.

> **Catatan Mode Pratinjau:** Tanpa file `.env.local`, aplikasi tetap berjalan aman menggunakan data contoh (`src/lib/mock-data.ts`) agar tampilan toko, checkout, pelacakan, dan pratinjau admin bisa langsung dicek tanpa error.

---

## 1. Setup / Migrasi Database Supabase

### A. Proyek Baru (Fresh Install)
1. Masuk ke [Supabase Dashboard](https://supabase.com/dashboard) → **SQL Editor** → **New query**.
2. Jalankan seluruh isi `supabase/schema.sql`.
3. Buka query baru dan jalankan seluruh isi `supabase/seed.sql`.

### B. Upgrade dari V1 ke V2 (Database Sudah Ada)
1. Buka **SQL Editor** → **New query**.
2. Salin seluruh isi **`supabase/migration_v2.sql`** dan klik **Run**.
   - Migrasi ini bersifat *idempotent* (aman dijalankan ulang) dan akan:
     - Menambah kolom media (`hero_image_url`, `logo_image_url`, `og_image_url`, `story_image_url`, `location_image_url`, `dana_qr_image_url`), konten (`why_items_json`, `hero_badge_text`, `cta_primary_text`, `footer_description`), dan pengaturan pembayaran (`DANA`, `COD`, `Ambil di Tempat`) pada `store_settings`.
     - Meng-upgrade tabel `orders` dengan alur **Approval Admin**, status pembayaran (`payment_status`, `payment_proof_url`), dan riwayat status (`status_history_json`).
     - Membuat RPC publik aman (`get_public_order`, `track_orders_by_query`, `attach_order_payment_proof`) serta RPC approval atomik (`process_order_action`).
     - Membuat bucket Storage **`site-assets`** (maks 4 MB) dan **`payment-proofs`** (maks 3 MB) beserta policy RLS-nya.

### C. Upgrade dari V2 ke V3 (Custom Options Engine & Voucher)
1. Buka **SQL Editor** → **New query**.
2. Salin seluruh isi **`supabase/migration_v3.sql`** dan klik **Run**.
   - Migrasi ini bersifat *idempotent* dan akan:
     - Mengubah `products.variety_category` menjadi `text` agar mendukung kategori varietas kustom dari Admin.
     - Membuat tabel **`custom_options`** (packing, penyajian, grade butir, add-on checkout, kategori), **`delivery_zones`** (zona ongkir + opsi COD), dan **`promo_vouchers`** (kode promo persen/nominal) lengkap dengan RLS & seed awal.
     - Menambah kolom `gram_presets_json` pada `store_settings` serta snapshot rincian ongkir, add-on, dan voucher pada `orders`.
     - Memperbarui RPC `format_public_order` dan menambah RPC `increment_voucher_usage`.

---

## 2. Buat Akun Admin Pertama di Supabase Auth

1. Di Supabase Dashboard, buka **Authentication** → **Users** → **Add user** → **Create new user**.
2. Masukkan email dan kata sandi admin, lalu centang **Auto Confirm User**.
3. *(Opsional)* Nonaktifkan public sign-ups di pengaturan Auth agar hanya admin terdaftar yang dapat login.

---

## 3. Isi `.env.local`

Salin `.env.example` menjadi `.env.local` lalu isi dengan **Project API URL** (bukan URL halaman dashboard browser) dan **anon/publishable key** dari **Project Settings → API**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://kodeproyekanda.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 4. Menjalankan Secara Lokal & Produksi

```bash
npm install
npm run dev
```

Rute utama:
- **Storefront:** `http://localhost:3000`
- **Checkout:** `http://localhost:3000/checkout`
- **Lacak Pesanan:** `http://localhost:3000/lacak`
- **Invoice Pesanan:** `http://localhost:3000/order/[orderCode]`
- **Admin CMS:** `http://localhost:3000/admin` (Login: `/admin/login`)

---

## 5. Checklist Uji Coba V2

1. **Tampilan & Foto Web (`/admin/tampilan`):** Unggah atau ubah foto Hero, Logo, OG Image, Foto Kebun, Foto Lokasi, atau QR DANA — simpan dan refresh beranda untuk melihat perubahan langsung.
2. **Konten & Copywriting (`/admin/konten`):** Edit teks banner panen, headline hero, ticker berjalan, 4 kartu keunggulan, dan deskripsi footer.
3. **Pembayaran & Info Toko (`/admin/pengaturan`):** Aktif/nonaktifkan metode **DANA**, **COD**, dan **Ambil di Tempat**, lalu cek `/checkout`.
4. **Checkout & Upload Bukti DANA (`/checkout` → `/order/[orderCode]`):** Buat pesanan dengan metode DANA, unggah screenshot bukti transfer (JPG/PNG/WebP maks 3 MB), lalu cek status di `/lacak`.
5. **Approval Admin & Stok Atomik (`/admin/pesanan`):** Buka tab *Menunggu Approval*, klik **Tinjau**, perbesar bukti transfer DANA, lalu klik **Approve / Setujui Pesanan** (stok butir/gram otomatis terpotong) atau **Tolak Pesanan** dengan alasan wajib (stok otomatis dikembalikan jika sempat dipotong).
6. **Mesin Kustomisasi (`/admin/kustomisasi`):** Tambah atau ubah opsi **Custom Packing**, **Penyajian & Grade Butir**, **Kategori & Preset Gramasi**, **Zona Ongkir & Add-on Checkout**, serta **Kode Promo / Voucher**, lalu verifikasi kalkulator produk & halaman `/checkout` langsung ter-update.

---

## 6. Verifikasi Build

```bash
npm run typecheck
npm run lint
npm run build
npm run start
```
