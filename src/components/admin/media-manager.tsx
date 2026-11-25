"use client";

import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ImageUploadCard } from "@/components/admin/image-upload-card";
import { Button } from "@/components/ui/button";
import { saveStoreMedia } from "@/lib/actions/settings";
import type { StoreSettings } from "@/types/database";

export function MediaManager({
  settings,
  configured,
}: {
  settings: StoreSettings;
  configured: boolean;
}) {
  const router = useRouter();
  const [heroUrl, setHeroUrl] = useState(settings.hero_image_url);
  const [logoUrl, setLogoUrl] = useState(settings.logo_image_url ?? "");
  const [ogUrl, setOgUrl] = useState(settings.og_image_url);
  const [storyUrl, setStoryUrl] = useState(settings.story_image_url ?? "");
  const [locationUrl, setLocationUrl] = useState(settings.location_image_url ?? "");
  const [danaQrUrl, setDanaQrUrl] = useState(settings.dana_qr_image_url ?? "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) {
      toast.info("Mode pratinjau: hubungkan Supabase di .env.local untuk menyimpan foto website.");
      return;
    }

    setFieldErrors({});
    startTransition(async () => {
      const res = await saveStoreMedia({
        hero_image_url: heroUrl,
        logo_image_url: logoUrl,
        og_image_url: ogUrl,
        story_image_url: storyUrl,
        location_image_url: locationUrl,
        dana_qr_image_url: danaQrUrl,
      });

      if (!res.ok) {
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        toast.error(res.error);
        return;
      }

      toast.success(res.message ?? "Foto website diperbarui.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-hover">Editor Visual</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-orchard">Tampilan &amp; Foto Elemen Web</h1>
          <p className="mt-1 text-sm text-moss">
            Ganti foto hero, logo brand, gambar pratinjau link (OG), foto kebun, serta QR DANA langsung dari sini.
          </p>
        </div>
        <Button type="submit" variant="gold" disabled={pending}>
          <Save className="size-4" />
          {pending ? "Menyimpan…" : "Simpan Semua Foto"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ImageUploadCard
          title="Foto Banner Hero Utama"
          description="Tampil di sebelah kanan bagian paling atas halaman utama."
          value={heroUrl}
          onChange={setHeroUrl}
          folder="hero"
          assetName="hero-banner"
          defaultValue="/images/hero.webp"
          configured={configured}
          error={fieldErrors.hero_image_url}
        />

        <ImageUploadCard
          title="Foto Cerita Kebun / Bagian Keunggulan"
          description="Banner horizontal opsional di bagian Keunggulan Kebun Pak Agung."
          value={storyUrl}
          onChange={setStoryUrl}
          folder="sections"
          assetName="story-kebun"
          defaultValue=""
          configured={configured}
          error={fieldErrors.story_image_url}
        />

        <ImageUploadCard
          title="Foto Lapak / Kebun Sigaluh"
          description="Menghiasi kartu lokasi Karangmangu di bagian bawah beranda."
          value={locationUrl}
          onChange={setLocationUrl}
          folder="sections"
          assetName="lokasi-lapak"
          defaultValue=""
          configured={configured}
          error={fieldErrors.location_image_url}
        />

        <ImageUploadCard
          title="Gambar QR Pembayaran DANA (Opsional)"
          description="Ditampilkan saat pembeli memilih metode pembayaran Transfer DANA."
          value={danaQrUrl}
          onChange={setDanaQrUrl}
          folder="payment"
          assetName="qr-dana"
          defaultValue=""
          aspectClass="aspect-square max-w-60 mx-auto"
          configured={configured}
          error={fieldErrors.dana_qr_image_url}
        />

        <ImageUploadCard
          title="Logo Brand (Opsional)"
          description="Kosongkan untuk tetap memakai emblem vektor khas AgungDurian."
          value={logoUrl}
          onChange={setLogoUrl}
          folder="branding"
          assetName="logo-brand"
          defaultValue=""
          aspectClass="aspect-square max-w-52 mx-auto"
          configured={configured}
          error={fieldErrors.logo_image_url}
        />

        <ImageUploadCard
          title="OG Share Image (WhatsApp / Sosial Media)"
          description="Gambar pratinjau saat tautan toko dibagikan ke WhatsApp atau media sosial."
          value={ogUrl}
          onChange={setOgUrl}
          folder="branding"
          assetName="og-share"
          defaultValue="/images/og-image.jpg"
          aspectClass="aspect-[1200/630]"
          configured={configured}
          error={fieldErrors.og_image_url}
        />
      </div>
    </form>
  );
}
