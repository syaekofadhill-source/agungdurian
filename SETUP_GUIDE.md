# Panduan Setup AgungDurian (E-Commerce & Admin CMS)

Panduan ini menjelaskan langkah demi langkah untuk menyiapkan proyek **AgungDurian** dengan backend **Supabase** (PostgreSQL, Auth, Storage) serta menjalankannya secara lokal maupun produksi.

> **Catatan Mode Pratinjau:** Tanpa file `.env.local`, aplikasi tetap berjalan aman menggunakan data contoh (`src/lib/mock-data.ts`) agar tampilan toko dan pratinjau admin bisa langsung dicek tanpa error. Untuk mengaktifkan login admin, penyimpanan pesanan, upload gambar, dan CMS live, ikuti langkah di bawah ini.

---

## 1. Buat Proyek Supabase & Jalankan Skema SQL

1. Masuk ke [Supabase Dashboard](https://supabase.com/dashboard) dan buat proyek baru (pilih region terdekat, misalnya **Singapore / ap-southeast-1**).
2. Buka menu **SQL Editor** → **New query**.
3. Salin seluruh isi file `supabase/schema.sql`, tempel ke editor, lalu klik **Run**.
   - File ini bersifat *idempotent* (aman dijalankan ulang) dan akan membuat:
     - Tipe enum (`harvest_status`, `order_status`, `variety_category`, `delivery_method`)
     - Tabel `store_settings`, `products`, `orders`, `testimonials`
     - Fungsi atomik pengelola stok (`apply_order_stock`, `transition_order_status`, `adjust_product_stock`)
     - Kebijakan **Row Level Security (RLS)** untuk akses publik (`anon`) & admin (`authenticated`)
     - Bucket Storage `product-images` (publik baca, hanya admin tulis)
4. Setelah `schema.sql` sukses, buka query baru di **SQL Editor**, salin isi `supabase/seed.sql`, lalu klik **Run** untuk mengisi 6 varietas durian Sigaluh, 4 testimoni pembeli, dan pengaturan default toko.

---

## 2. Buat Akun Admin Pertama di Supabase Auth

1. Di Supabase Dashboard, buka menu **Authentication** → **Users**.
2. Klik **Add user** → **Create new user**.
3. Masukkan email dan kata sandi admin (misalnya `admin@agungdurian.id`), lalu centang **Auto Confirm User** agar akun langsung aktif tanpa verifikasi email.
4. *(Opsional keamanan tambahan)* Di **Authentication** → **Providers** / **Sign In**, nonaktifkan **Allow new users to sign up** jika pendaftaran publik tidak diperlukan, sehingga hanya admin yang Anda buat lewat dashboard yang bisa login.

---

## 3. Isi Variabel Lingkungan (`.env.local`)

1. Salin `.env.example` menjadi `.env.local` di root folder `d:\agungdurian`:
   ```bash
   cp .env.example .env.local
   ```
2. Di Supabase Dashboard, buka **Project Settings** → **API** dan salin:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Isi `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://kodeproyekanda.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

---

## 4. Menjalankan Secara Lokal

```bash
npm install
npm run dev
```

- **Storefront Publik:** `http://localhost:3000`
- **Halaman Login Admin:** `http://localhost:3000/admin/login`
- **Dashboard Admin:** `http://localhost:3000/admin` (otomatis mengarahkan ke `/admin/login` bila belum login)

---

## 5. Checklist Uji Coba Fitur Utama

1. **Dual Selling Engine (`/`):** Buka salah satu produk seperti *Durian Bawor Kaki Tiga*, uji sakelar **Per Butir** vs **Per Gram** (slider gramasi kelipatan 50g + pilihan *Thinwall* / *Vacuum Pack*), lalu tambahkan ke keranjang.
2. **Logged WhatsApp Checkout:** Buka Drawer Keranjang, isi nama, nomor HP (`08xxx` otomatis diubah ke `628xxx`), dan pilih metode pengiriman. Setelah dikirim, pesanan tercatat di tabel `orders` dengan kode `AGD-YYYYMMDD-XXXX` dan tombol **Buka WhatsApp Sekarang** menuju nomor WA yang diatur di CMS.
3. **Smart Stock Deduction (`/admin/pesanan`):** Buka detail pesanan berstatus `pending`, aktifkan sakelar *Potong Stok Otomatis*, lalu klik **Konfirmasi Pesanan**. Stok `stock_butir` / `stock_gram` produk terkait langsung berkurang secara atomik di PostgreSQL (dan kembali otomatis bila dibatalkan).
4. **Site CMS (`/admin/pengaturan`):** Ubah teks banner panen, nomor WhatsApp, atau kalimat marquee, lalu klik **Simpan & Tayangkan** — halaman depan langsung diperbarui melalui `revalidatePath`.
5. **Upload Gambar (`/admin/produk`):** Tambah atau edit produk, unggah foto durian ke bucket `product-images`, dan verifikasi pratinjau langsung tampil.

---

## 6. Build Produksi & Verifikasi

```bash
npm run typecheck
npm run lint
npm run build
npm run start
```

Saat deploy ke Vercel atau hosting Node.js lainnya, pastikan `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, dan `NEXT_PUBLIC_SITE_URL` (domain produksi `https://...`) sudah diisi di environment variables platform Anda.
