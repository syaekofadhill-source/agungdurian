"use client";

import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldError, Input, Select, Textarea } from "@/components/ui/field";
import { saveSettings } from "@/lib/actions/settings";
import { HARVEST_STATUS_META } from "@/lib/constants";
import { prettyPhone, sanitizePhone } from "@/lib/utils";
import type { HarvestStatus, StoreSettings } from "@/types/database";

export function SettingsForm({
  settings,
  configured,
}: {
  settings: StoreSettings;
  configured: boolean;
}) {
  const router = useRouter();
  const [storeName, setStoreName] = useState(settings.store_name);
  const [tagline, setTagline] = useState(settings.tagline);
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp_number);
  const [instagram, setInstagram] = useState(settings.instagram_handle);
  const [address, setAddress] = useState(settings.address);
  const [mapsUrl, setMapsUrl] = useState(settings.maps_url);
  const [openingHours, setOpeningHours] = useState(settings.opening_hours);
  const [harvestStatus, setHarvestStatus] = useState<HarvestStatus>(settings.harvest_status);
  const [bannerText, setBannerText] = useState(settings.harvest_banner_text);
  const [heroHeadline, setHeroHeadline] = useState(settings.hero_headline);
  const [heroSubheadline, setHeroSubheadline] = useState(settings.hero_subheadline);
  const [googleRating, setGoogleRating] = useState(String(settings.google_rating));
  const [googleReviewCount, setGoogleReviewCount] = useState(String(settings.google_review_count));
  const [marqueeItems, setMarqueeItems] = useState<string[]>(
    settings.marquee_items.length ? settings.marquee_items : ["Durian Matang Pohon Sigaluh"],
  );
  const [newTicker, setNewTicker] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function addTicker() {
    const val = newTicker.trim();
    if (val.length < 2) {
      toast.error("Kalimat ticker minimal 2 karakter.");
      return;
    }
    if (marqueeItems.length >= 20) {
      toast.error("Maksimal 20 kalimat ticker.");
      return;
    }
    setMarqueeItems((prev) => [...prev, val]);
    setNewTicker("");
  }

  function moveTicker(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= marqueeItems.length) return;
    setMarqueeItems((prev) => {
      const next = [...prev];
      const current = next[index];
      const swap = next[target];
      if (current === undefined || swap === undefined) return prev;
      next[index] = swap;
      next[target] = current;
      return next;
    });
  }

  function removeTicker(index: number) {
    if (marqueeItems.length <= 1) {
      toast.error("Minimal satu kalimat ticker harus tersisa.");
      return;
    }
    setMarqueeItems((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) {
      toast.info("Mode pratinjau: hubungkan Supabase di .env.local untuk menyimpan CMS toko.");
      return;
    }

    setFormError(null);
    setFieldErrors({});

    startTransition(async () => {
      const cleanedMarquee = marqueeItems.map((s) => s.trim()).filter((s) => s.length >= 2);
      const res = await saveSettings({
        store_name: storeName,
        tagline,
        whatsapp_number: whatsapp,
        instagram_handle: instagram,
        address,
        maps_url: mapsUrl,
        opening_hours: openingHours,
        harvest_status: harvestStatus,
        harvest_banner_text: bannerText,
        marquee_items: cleanedMarquee,
        hero_headline: heroHeadline,
        hero_subheadline: heroSubheadline,
        google_rating: Number(googleRating) || 4.7,
        google_review_count: Number(googleReviewCount) || 0,
      });

      if (!res.ok) {
        setFormError(res.error);
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        toast.error(res.error);
        return;
      }

      toast.success(res.message ?? "Pengaturan toko disimpan.");
      router.refresh();
    });
  }

  const normalizedWa = sanitizePhone(whatsapp);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-hover">Site CMS</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-orchard">Pengaturan Toko</h1>
        </div>
        <Button type="submit" variant="gold" disabled={pending}>
          <Save className="size-4" />
          {pending ? "Menyimpan…" : "Simpan & Tayangkan"}
        </Button>
      </div>

      {formError ? (
        <div role="alert" className="rounded-2xl border border-crimson/25 bg-crimson/10 px-4 py-3 text-xs font-medium text-crimson">
          {formError}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-3xl border border-orchard/10 bg-white/85 p-6 shadow-soft">
          <h2 className="font-display text-xl font-bold text-orchard">Identitas &amp; Kontak WhatsApp</h2>

          <Field label="Nama Toko" htmlFor="s-name" error={fieldErrors.store_name}>
            <Input id="s-name" required value={storeName} onChange={(e) => setStoreName(e.target.value)} />
          </Field>

          <Field label="Tagline" htmlFor="s-tag" error={fieldErrors.tagline}>
            <Input id="s-tag" value={tagline} onChange={(e) => setTagline(e.target.value)} />
          </Field>

          <Field
            label="Nomor WhatsApp Admin"
            htmlFor="s-wa"
            hint={`Akan diformat otomatis ke 62xxx → ${normalizedWa ? prettyPhone(normalizedWa) : "—"}`}
            error={fieldErrors.whatsapp_number}
          >
            <Input
              id="s-wa"
              required
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="6281391094308"
              className="font-mono"
            />
          </Field>

          <Field label="Instagram Handle" htmlFor="s-ig" error={fieldErrors.instagram_handle}>
            <Input
              id="s-ig"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="agungdurian.sigaluh"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Rating Google" htmlFor="s-rating" error={fieldErrors.google_rating}>
              <Input
                id="s-rating"
                type="number"
                step={0.1}
                min={0}
                max={5}
                value={googleRating}
                onChange={(e) => setGoogleRating(e.target.value)}
                className="font-mono"
              />
            </Field>
            <Field label="Jumlah Ulasan Google" htmlFor="s-rev" error={fieldErrors.google_review_count}>
              <Input
                id="s-rev"
                type="number"
                min={0}
                value={googleReviewCount}
                onChange={(e) => setGoogleReviewCount(e.target.value)}
                className="font-mono"
              />
            </Field>
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-orchard/10 bg-white/85 p-6 shadow-soft">
          <h2 className="font-display text-xl font-bold text-orchard">Kebun &amp; Lokasi</h2>

          <Field label="Alamat Kebun / Gerai" htmlFor="s-addr" error={fieldErrors.address}>
            <Textarea
              id="s-addr"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="min-h-20"
            />
          </Field>

          <Field label="Jam Buka" htmlFor="s-hours" error={fieldErrors.opening_hours}>
            <Input id="s-hours" required value={openingHours} onChange={(e) => setOpeningHours(e.target.value)} />
          </Field>

          <Field label="Tautan Google Maps" htmlFor="s-maps" error={fieldErrors.maps_url}>
            <Input
              id="s-maps"
              type="url"
              required
              value={mapsUrl}
              onChange={(e) => setMapsUrl(e.target.value)}
              placeholder="https://maps.google.com/..."
            />
          </Field>
        </section>

        <section className="space-y-4 rounded-3xl border border-orchard/10 bg-white/85 p-6 shadow-soft">
          <h2 className="font-display text-xl font-bold text-orchard">Status Panen &amp; Hero</h2>

          <Field label="Status Musim Panen" htmlFor="s-status" error={fieldErrors.harvest_status}>
            <Select
              id="s-status"
              value={harvestStatus}
              onChange={(e) => setHarvestStatus(e.target.value as HarvestStatus)}
            >
              {(Object.keys(HARVEST_STATUS_META) as HarvestStatus[]).map((key) => (
                <option key={key} value={key}>
                  {HARVEST_STATUS_META[key].label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Teks Pengumuman Atas" htmlFor="s-banner" error={fieldErrors.harvest_banner_text}>
            <Input id="s-banner" required value={bannerText} onChange={(e) => setBannerText(e.target.value)} />
          </Field>

          <Field label="Headline Utama Hero" htmlFor="s-hero" error={fieldErrors.hero_headline}>
            <Textarea
              id="s-hero"
              required
              value={heroHeadline}
              onChange={(e) => setHeroHeadline(e.target.value)}
              className="min-h-20"
            />
          </Field>

          <Field label="Sub-headline Hero" htmlFor="s-subhero" error={fieldErrors.hero_subheadline}>
            <Textarea
              id="s-subhero"
              value={heroSubheadline}
              onChange={(e) => setHeroSubheadline(e.target.value)}
              className="min-h-24"
            />
          </Field>
        </section>

        <section className="space-y-4 rounded-3xl border border-orchard/10 bg-white/85 p-6 shadow-soft">
          <div>
            <h2 className="font-display text-xl font-bold text-orchard">Running Text / Marquee Varietas</h2>
            <p className="mt-1 text-xs text-moss">Ditampilkan sebagai ticker berjalan di bawah hero beranda.</p>
          </div>
          <FieldError messages={fieldErrors.marquee_items} />

          <div className="flex gap-2">
            <Input
              value={newTicker}
              onChange={(e) => setNewTicker(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTicker();
                }
              }}
              placeholder="Contoh: Garansi ganti baru jika hambar"
            />
            <Button type="button" variant="orchard" onClick={addTicker}>
              <Plus className="size-4" />
              Tambah
            </Button>
          </div>

          <ul className="space-y-2">
            {marqueeItems.map((item, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <Input
                  value={item}
                  onChange={(e) =>
                    setMarqueeItems((prev) => prev.map((v, i) => (i === idx ? e.target.value : v)))
                  }
                  className="h-9 text-xs"
                />
                <button
                  type="button"
                  onClick={() => moveTicker(idx, -1)}
                  disabled={idx === 0}
                  className="grid size-9 shrink-0 place-items-center rounded-xl border border-orchard/12 bg-cream text-orchard hover:bg-cream-2 disabled:opacity-35"
                  aria-label="Naikkan urutan"
                >
                  <ArrowUp className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveTicker(idx, 1)}
                  disabled={idx === marqueeItems.length - 1}
                  className="grid size-9 shrink-0 place-items-center rounded-xl border border-orchard/12 bg-cream text-orchard hover:bg-cream-2 disabled:opacity-35"
                  aria-label="Turunkan urutan"
                >
                  <ArrowDown className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => removeTicker(idx)}
                  className="grid size-9 shrink-0 place-items-center rounded-xl border border-orchard/12 bg-white text-moss hover:border-crimson/40 hover:text-crimson"
                  aria-label="Hapus item"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </form>
  );
}
