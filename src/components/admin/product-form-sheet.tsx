"use client";

import { Upload, Wand2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ProductImage } from "@/components/store/product-image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogDescription, DialogTitle, SheetContent } from "@/components/ui/dialog";
import { Field, FieldError, Input, Select, Textarea } from "@/components/ui/field";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { saveProduct } from "@/lib/actions/products";
import { PRODUCT_IMAGE_BUCKET } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import type { Product, VarietyCategory } from "@/types/database";

function ProductFormBody({
  product,
  configured,
  onSuccess,
}: {
  product: Product | null;
  configured: boolean;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(product));
  const [category, setCategory] = useState<VarietyCategory>(product?.variety_category ?? "lokal");
  const [badge, setBadge] = useState(product?.badge ?? "");
  const [sortOrder, setSortOrder] = useState(String(product?.sort_order ?? 10));
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [originNotes, setOriginNotes] = useState(product?.origin_notes ?? "");

  const [allowButir, setAllowButir] = useState(product?.allow_butir ?? true);
  const [priceButir, setPriceButir] = useState(String(product?.price_butir ?? 85000));
  const [avgWeightKg, setAvgWeightKg] = useState(String(product?.avg_weight_kg ?? 2.0));
  const [stockButir, setStockButir] = useState(String(product?.stock_butir ?? 10));

  const [allowGram, setAllowGram] = useState(product?.allow_gram ?? true);
  const [pricePer100g, setPricePer100g] = useState(String(product?.price_per_100g ?? 10000));
  const [stockGram, setStockGram] = useState(String(product?.stock_gram ?? 2500));
  const [minGram, setMinGram] = useState(String(product?.min_gram ?? 250));
  const [maxGram, setMaxGram] = useState(String(product?.max_gram ?? 2000));

  const [tasteSweet, setTasteSweet] = useState(product?.taste_sweet ?? 4);
  const [tasteCreamy, setTasteCreamy] = useState(product?.taste_creamy ?? 4);
  const [tasteBitter, setTasteBitter] = useState(product?.taste_bitter ?? 2);
  const [tasteThickness, setTasteThickness] = useState(product?.taste_thickness ?? 4);

  const [isFeatured, setIsFeatured] = useState(product?.is_featured ?? false);
  const [isActive, setIsActive] = useState(product?.is_active ?? true);

  const [uploading, setUploading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleNameChange(val: string) {
    setName(val);
    if (!slugEdited) setSlug(slugify(val));
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!configured) {
      toast.info("Mode pratinjau: unggah gambar ke Storage aktif setelah Supabase terhubung.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran gambar maksimal 5 MB.");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      toast.error("Klien Supabase belum siap.");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "webp";
      const safeName = slugify(slug || name || "durian") || "durian";
      const path = `products/${Date.now()}-${safeName}.${ext}`;

      const { error } = await supabase.storage
        .from(PRODUCT_IMAGE_BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: true });

      if (error) {
        toast.error(`Gagal unggah gambar: ${error.message}`);
        return;
      }

      const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
      setImageUrl(data.publicUrl);
      toast.success("Gambar berhasil diunggah ke Supabase Storage.");
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) {
      toast.info("Mode pratinjau lokal: hubungkan Supabase di .env.local untuk menyimpan perubahan.");
      return;
    }

    setFormError(null);
    setFieldErrors({});

    startTransition(async () => {
      const res = await saveProduct(
        {
          name,
          slug,
          variety_category: category,
          description,
          origin_notes: originNotes,
          image_url: imageUrl,
          allow_butir: allowButir,
          price_butir: Number(priceButir) || 0,
          avg_weight_kg: Number(avgWeightKg) || 1.5,
          stock_butir: Number(stockButir) || 0,
          allow_gram: allowGram,
          price_per_100g: Number(pricePer100g) || 0,
          stock_gram: Number(stockGram) || 0,
          min_gram: Number(minGram) || 250,
          max_gram: Number(maxGram) || 2000,
          taste_sweet: tasteSweet,
          taste_creamy: tasteCreamy,
          taste_bitter: tasteBitter,
          taste_thickness: tasteThickness,
          badge: badge.trim() ? badge : null,
          is_featured: isFeatured,
          is_active: isActive,
          sort_order: Number(sortOrder) || 0,
        },
        product?.id,
      );

      if (!res.ok) {
        setFormError(res.error);
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        toast.error(res.error);
        return;
      }

      toast.success(res.message ?? "Produk tersimpan.");
      onSuccess();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
        {formError ? (
          <div role="alert" className="rounded-2xl border border-crimson/25 bg-crimson/10 px-4 py-3 text-xs font-medium text-crimson">
            {formError}
          </div>
        ) : null}

        <div className="flex items-center gap-4 rounded-2xl border border-orchard/10 bg-cream-2/60 p-3.5">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-orchard">
            <ProductImage src={imageUrl} alt={name || "Preview"} fill sizes="80px" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-orchard px-3.5 py-1.5 text-xs font-semibold text-cream transition hover:bg-orchard-2">
              <Upload className="size-3.5 text-gold" />
              <span>{uploading ? "Mengunggah…" : "Unggah Foto ke Storage"}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={handleFileUpload}
                disabled={uploading}
                className="sr-only"
              />
            </label>
            <p className="text-[11px] text-moss">Format JPG/PNG/WebP/AVIF maks. 5 MB, atau tempel URL gambar di bawah.</p>
          </div>
        </div>

        <Field label="URL Gambar Produk" htmlFor="p-img" error={fieldErrors.image_url}>
          <Input
            id="p-img"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://... atau /images/products/bawor.webp"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama Varietas" htmlFor="p-name" error={fieldErrors.name} className="sm:col-span-2">
            <Input id="p-name" required value={name} onChange={(e) => handleNameChange(e.target.value)} />
          </Field>

          <Field label="Slug URL" htmlFor="p-slug" error={fieldErrors.slug}>
            <div className="flex gap-1.5">
              <Input
                id="p-slug"
                required
                value={slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  setSlug(e.target.value);
                }}
                className="font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  setSlugEdited(true);
                  setSlug(slugify(name));
                }}
                className="grid size-11 shrink-0 place-items-center rounded-xl border border-orchard/15 bg-white text-orchard hover:bg-cream-2"
                title="Buat ulang slug dari nama"
                aria-label="Buat ulang slug dari nama"
              >
                <Wand2 className="size-4" />
              </button>
            </div>
          </Field>

          <Field label="Kategori" htmlFor="p-cat" error={fieldErrors.variety_category}>
            <Select id="p-cat" value={category} onChange={(e) => setCategory(e.target.value as VarietyCategory)}>
              <option value="lokal">Lokal Sigaluh</option>
              <option value="premium">Premium / Unggulan</option>
              <option value="kupas">Paket Kupas / Box</option>
            </Select>
          </Field>

          <Field label="Badge Label (Opsional)" htmlFor="p-badge" error={fieldErrors.badge}>
            <Input
              id="p-badge"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              placeholder="Terlaris / Unggulan Kebun"
            />
          </Field>

          <Field label="Urutan Tampil" htmlFor="p-sort" error={fieldErrors.sort_order}>
            <Input
              id="p-sort"
              type="number"
              min={0}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="font-mono"
            />
          </Field>
        </div>

        <Field label="Deskripsi Singkat & Rasa" htmlFor="p-desc" error={fieldErrors.description}>
          <Textarea id="p-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>

        <Field label="Catatan Kebun / Asal Pohon" htmlFor="p-origin" error={fieldErrors.origin_notes}>
          <Textarea
            id="p-origin"
            value={originNotes}
            onChange={(e) => setOriginNotes(e.target.value)}
            className="min-h-18"
          />
        </Field>

        {/* Mode Per Butir */}
        <div className="space-y-3 rounded-2xl border border-orchard/12 bg-white/75 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-orchard">Mode Jual Per Butir (Utuh)</p>
              <p className="text-xs text-moss">Pembeli memilih ukuran Sedang/Besar/Jumbo.</p>
            </div>
            <Switch checked={allowButir} onCheckedChange={setAllowButir} aria-label="Aktifkan mode per butir" />
          </div>
          <FieldError messages={fieldErrors.allow_butir} />
          {allowButir ? (
            <div className="grid gap-3 pt-2 sm:grid-cols-3">
              <Field label="Harga Sedang (Rp)" htmlFor="p-pbutir" error={fieldErrors.price_butir}>
                <Input
                  id="p-pbutir"
                  type="number"
                  min={0}
                  step={1000}
                  value={priceButir}
                  onChange={(e) => setPriceButir(e.target.value)}
                  className="font-mono"
                />
              </Field>
              <Field label="Bobot Rata-rata (kg)" htmlFor="p-wkg" error={fieldErrors.avg_weight_kg}>
                <Input
                  id="p-wkg"
                  type="number"
                  min={0.3}
                  max={10}
                  step={0.1}
                  value={avgWeightKg}
                  onChange={(e) => setAvgWeightKg(e.target.value)}
                  className="font-mono"
                />
              </Field>
              <Field label="Stok Butir" htmlFor="p-sbutir" error={fieldErrors.stock_butir}>
                <Input
                  id="p-sbutir"
                  type="number"
                  min={0}
                  value={stockButir}
                  onChange={(e) => setStockButir(e.target.value)}
                  className="font-mono"
                />
              </Field>
            </div>
          ) : null}
        </div>

        {/* Mode Per Gram */}
        <div className="space-y-3 rounded-2xl border border-orchard/12 bg-white/75 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-orchard">Mode Jual Per Gram (Kupas)</p>
              <p className="text-xs text-moss">Dihitung otomatis dari harga per 100g.</p>
            </div>
            <Switch checked={allowGram} onCheckedChange={setAllowGram} aria-label="Aktifkan mode per gram" />
          </div>
          {allowGram ? (
            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              <Field label="Harga per 100g (Rp)" htmlFor="p-pgram" error={fieldErrors.price_per_100g}>
                <Input
                  id="p-pgram"
                  type="number"
                  min={0}
                  step={500}
                  value={pricePer100g}
                  onChange={(e) => setPricePer100g(e.target.value)}
                  className="font-mono"
                />
              </Field>
              <Field label="Stok Daging (gram)" htmlFor="p-sgram" error={fieldErrors.stock_gram}>
                <Input
                  id="p-sgram"
                  type="number"
                  min={0}
                  step={50}
                  value={stockGram}
                  onChange={(e) => setStockGram(e.target.value)}
                  className="font-mono"
                />
              </Field>
              <Field label="Min Gram" htmlFor="p-ming" error={fieldErrors.min_gram}>
                <Input
                  id="p-ming"
                  type="number"
                  min={50}
                  step={50}
                  value={minGram}
                  onChange={(e) => setMinGram(e.target.value)}
                  className="font-mono"
                />
              </Field>
              <Field label="Maks Gram" htmlFor="p-maxg" error={fieldErrors.max_gram}>
                <Input
                  id="p-maxg"
                  type="number"
                  min={100}
                  step={50}
                  value={maxGram}
                  onChange={(e) => setMaxGram(e.target.value)}
                  className="font-mono"
                />
              </Field>
            </div>
          ) : null}
        </div>

        {/* Taste Profile */}
        <div className="space-y-3 rounded-2xl border border-orchard/12 bg-cream-2/55 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-orchard">Profil Rasa (1–5)</p>
          {[
            { label: "Manis", val: tasteSweet, set: setTasteSweet },
            { label: "Legit / Creamy", val: tasteCreamy, set: setTasteCreamy },
            { label: "Pahit Khas", val: tasteBitter, set: setTasteBitter },
            { label: "Ketebalan Daging", val: tasteThickness, set: setTasteThickness },
          ].map((row) => (
            <div key={row.label} className="grid grid-cols-[7.5rem_1fr_2rem] items-center gap-3">
              <span className="text-xs font-semibold text-bark">{row.label}</span>
              <Slider min={1} max={5} step={1} value={[row.val]} onValueChange={(v) => row.set(v[0] ?? row.val)} />
              <span className="text-right font-mono text-xs font-bold text-orchard tabular">{row.val}/5</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-orchard/12 bg-white/75 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-bark">Produk Unggulan</span>
            <Switch checked={isFeatured} onCheckedChange={setIsFeatured} aria-label="Produk unggulan" />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-bark">Tampil di Toko</span>
            <Switch checked={isActive} onCheckedChange={setIsActive} aria-label="Aktif di toko" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2.5 border-t border-orchard/10 bg-cream-2/60 px-6 py-4">
        <DialogClose className="inline-flex h-10 items-center rounded-full border border-orchard/15 px-5 text-xs font-semibold text-bark hover:bg-white">
          Batal
        </DialogClose>
        <Button type="submit" variant="gold" disabled={pending || uploading}>
          {pending ? "Menyimpan…" : product ? "Simpan Perubahan" : "Tambah Varietas"}
        </Button>
      </div>
    </form>
  );
}

export function ProductFormSheet({
  open,
  onOpenChange,
  product,
  configured,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  configured: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-w-xl p-0">
        <div className="flex items-center justify-between border-b border-orchard/10 px-6 py-4">
          <div>
            <DialogTitle className="font-display text-xl font-bold text-orchard">
              {product ? `Edit ${product.name}` : "Tambah Varietas Durian"}
            </DialogTitle>
            <DialogDescription className="text-xs text-moss">
              Atur harga ganda (butir &amp; gram), stok harian, dan profil rasa.
            </DialogDescription>
          </div>
          <DialogClose className="rounded-full px-3 py-1.5 text-xs font-semibold text-moss hover:bg-cream-2">
            Tutup
          </DialogClose>
        </div>

        <ProductFormBody
          key={product?.id ?? "new"}
          product={product}
          configured={configured}
          onSuccess={() => onOpenChange(false)}
        />
      </SheetContent>
    </Dialog>
  );
}
