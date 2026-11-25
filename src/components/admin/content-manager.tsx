"use client";

import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldError, Input, Select, Textarea } from "@/components/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { saveStoreContent } from "@/lib/actions/settings";
import { DEFAULT_WHY_ITEMS, HARVEST_STATUS_META } from "@/lib/constants";
import type { HarvestStatus, StoreSettings, WhyIconName, WhyItem } from "@/types/database";

export function ContentManager({
  settings,
  configured,
}: {
  settings: StoreSettings;
  configured: boolean;
}) {
  const router = useRouter();
  const [harvestStatus, setHarvestStatus] = useState<HarvestStatus>(settings.harvest_status);
  const [bannerText, setBannerText] = useState(settings.harvest_banner_text);
  const [heroBadge, setHeroBadge] = useState(settings.hero_badge_text);
  const [heroHeadline, setHeroHeadline] = useState(settings.hero_headline);
  const [heroSubheadline, setHeroSubheadline] = useState(settings.hero_subheadline);
  const [ctaPrimary, setCtaPrimary] = useState(settings.cta_primary_text);
  const [footerDesc, setFooterDesc] = useState(settings.footer_description);

  const [marqueeItems, setMarqueeItems] = useState<string[]>(
    settings.marquee_items.length ? settings.marquee_items : ["Durian Matang Pohon Sigaluh"],
  );
  const [newTicker, setNewTicker] = useState("");

  const [whyItems, setWhyItems] = useState<WhyItem[]>(
    settings.why_items_json?.length === 4 ? settings.why_items_json : DEFAULT_WHY_ITEMS,
  );

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
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

  function updateWhy(index: number, patch: Partial<WhyItem>) {
    setWhyItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) {
      toast.info("Mode pratinjau: hubungkan Supabase di .env.local untuk menyimpan konten.");
      return;
    }

    setFieldErrors({});
    startTransition(async () => {
      const res = await saveStoreContent({
        harvest_status: harvestStatus,
        harvest_banner_text: bannerText,
        hero_badge_text: heroBadge,
        hero_headline: heroHeadline,
        hero_subheadline: heroSubheadline,
        cta_primary_text: ctaPrimary,
        marquee_items: marqueeItems.map((s) => s.trim()).filter((s) => s.length >= 2),
        why_items_json: whyItems,
        footer_description: footerDesc,
      });

      if (!res.ok) {
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        toast.error(res.error);
        return;
      }

      toast.success(res.message ?? "Konten tersimpan.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-hover">Editor Copywriting</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-orchard">Konten &amp; Teks Website</h1>
        </div>
        <Button type="submit" variant="gold" disabled={pending}>
          <Save className="size-4" />
          {pending ? "Menyimpan…" : "Simpan & Tayangkan"}
        </Button>
      </div>

      <Tabs defaultValue="hero">
        <TabsList className="flex-wrap">
          <TabsTrigger value="hero">Hero &amp; Pengumuman</TabsTrigger>
          <TabsTrigger value="marquee">Ticker Berjalan</TabsTrigger>
          <TabsTrigger value="why">4 Kartu Keunggulan</TabsTrigger>
          <TabsTrigger value="footer">Deskripsi Footer</TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="mt-5">
          <div className="grid gap-6 rounded-3xl border border-orchard/10 bg-white/85 p-6 shadow-soft md:grid-cols-2">
            <Field label="Status Musim Panen" htmlFor="c-status" error={fieldErrors.harvest_status}>
              <Select
                id="c-status"
                value={harvestStatus}
                onChange={(e) => setHarvestStatus(e.target.value as HarvestStatus)}
              >
                {(Object.keys(HARVEST_STATUS_META) as HarvestStatus[]).map((k) => (
                  <option key={k} value={k}>
                    {HARVEST_STATUS_META[k].label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Teks Badge Hero" htmlFor="c-badge" error={fieldErrors.hero_badge_text}>
              <Input id="c-badge" required value={heroBadge} onChange={(e) => setHeroBadge(e.target.value)} />
            </Field>

            <Field
              label="Teks Pengumuman Atas (Announcement Bar)"
              htmlFor="c-banner"
              error={fieldErrors.harvest_banner_text}
              className="md:col-span-2"
            >
              <Input id="c-banner" required value={bannerText} onChange={(e) => setBannerText(e.target.value)} />
            </Field>

            <Field
              label="Headline Utama Hero"
              htmlFor="c-head"
              error={fieldErrors.hero_headline}
              className="md:col-span-2"
            >
              <Textarea
                id="c-head"
                required
                value={heroHeadline}
                onChange={(e) => setHeroHeadline(e.target.value)}
                className="min-h-20"
              />
            </Field>

            <Field
              label="Sub-headline Hero"
              htmlFor="c-sub"
              error={fieldErrors.hero_subheadline}
              className="md:col-span-2"
            >
              <Textarea
                id="c-sub"
                value={heroSubheadline}
                onChange={(e) => setHeroSubheadline(e.target.value)}
                className="min-h-24"
              />
            </Field>

            <Field label="Teks Tombol Utama Hero" htmlFor="c-cta" error={fieldErrors.cta_primary_text}>
              <Input id="c-cta" required value={ctaPrimary} onChange={(e) => setCtaPrimary(e.target.value)} />
            </Field>
          </div>
        </TabsContent>

        <TabsContent value="marquee" className="mt-5">
          <div className="space-y-4 rounded-3xl border border-orchard/10 bg-white/85 p-6 shadow-soft">
            <div>
              <h2 className="font-display text-xl font-bold text-orchard">Kalimat Running Text / Marquee</h2>
              <p className="mt-1 text-xs text-moss">Tampil berjalan halus tepat di bawah hero beranda.</p>
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
          </div>
        </TabsContent>

        <TabsContent value="why" className="mt-5">
          <div className="grid gap-5 md:grid-cols-2">
            {whyItems.map((item, idx) => (
              <div key={idx} className="space-y-3 rounded-3xl border border-orchard/10 bg-white/85 p-5 shadow-soft">
                <p className="text-xs font-bold uppercase tracking-wider text-gold-hover">Kartu #{idx + 1}</p>
                <Field label="Judul Kartu" htmlFor={`why-t-${idx}`}>
                  <Input
                    id={`why-t-${idx}`}
                    required
                    value={item.title}
                    onChange={(e) => updateWhy(idx, { title: e.target.value })}
                  />
                </Field>
                <Field label="Deskripsi" htmlFor={`why-d-${idx}`}>
                  <Textarea
                    id={`why-d-${idx}`}
                    required
                    value={item.description}
                    onChange={(e) => updateWhy(idx, { description: e.target.value })}
                    className="min-h-20"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Label Bawah / Badge" htmlFor={`why-b-${idx}`}>
                    <Input
                      id={`why-b-${idx}`}
                      required
                      value={item.badge}
                      onChange={(e) => updateWhy(idx, { badge: e.target.value })}
                    />
                  </Field>
                  <Field label="Ikon" htmlFor={`why-i-${idx}`}>
                    <Select
                      id={`why-i-${idx}`}
                      value={item.icon}
                      onChange={(e) => updateWhy(idx, { icon: e.target.value as WhyIconName })}
                    >
                      <option value="shield">Perisai (Garansi)</option>
                      <option value="sprout">Tunas (Kebun)</option>
                      <option value="scale">Timbangan</option>
                      <option value="truck">Pengiriman</option>
                    </Select>
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="footer" className="mt-5">
          <div className="rounded-3xl border border-orchard/10 bg-white/85 p-6 shadow-soft">
            <Field
              label="Deskripsi Singkat Footer"
              htmlFor="c-footer"
              hint="Ditampilkan di kolom kiri footer di seluruh halaman toko."
              error={fieldErrors.footer_description}
            >
              <Textarea
                id="c-footer"
                required
                value={footerDesc}
                onChange={(e) => setFooterDesc(e.target.value)}
              />
            </Field>
          </div>
        </TabsContent>
      </Tabs>
    </form>
  );
}
