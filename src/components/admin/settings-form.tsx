"use client";

import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldError, Input, Textarea } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { saveStoreGeneralAndPayment } from "@/lib/actions/settings";
import { prettyPhone, sanitizePhone } from "@/lib/utils";
import type { StoreSettings } from "@/types/database";

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
  const [googleRating, setGoogleRating] = useState(String(settings.google_rating));
  const [googleReviewCount, setGoogleReviewCount] = useState(String(settings.google_review_count));

  const [danaEnabled, setDanaEnabled] = useState(settings.payment_dana_enabled);
  const [danaNumber, setDanaNumber] = useState(settings.payment_dana_number);
  const [danaHolder, setDanaHolder] = useState(settings.payment_dana_holder);
  const [danaInstructions, setDanaInstructions] = useState(settings.payment_dana_instructions);

  const [codEnabled, setCodEnabled] = useState(settings.payment_cod_enabled);
  const [codNotes, setCodNotes] = useState(settings.payment_cod_notes);

  const [pickupEnabled, setPickupEnabled] = useState(settings.payment_pickup_enabled);
  const [pickupNotes, setPickupNotes] = useState(settings.payment_pickup_notes);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) {
      toast.info("Mode pratinjau: hubungkan Supabase di .env.local untuk menyimpan pengaturan.");
      return;
    }

    setFormError(null);
    setFieldErrors({});

    startTransition(async () => {
      const res = await saveStoreGeneralAndPayment({
        store_name: storeName,
        tagline,
        whatsapp_number: whatsapp,
        instagram_handle: instagram,
        address,
        maps_url: mapsUrl,
        opening_hours: openingHours,
        google_rating: Number(googleRating) || 4.7,
        google_review_count: Number(googleReviewCount) || 0,
        payment_dana_enabled: danaEnabled,
        payment_dana_number: danaNumber,
        payment_dana_holder: danaHolder,
        payment_dana_instructions: danaInstructions,
        payment_cod_enabled: codEnabled,
        payment_cod_notes: codNotes,
        payment_pickup_enabled: pickupEnabled,
        payment_pickup_notes: pickupNotes,
      });

      if (!res.ok) {
        setFormError(res.error);
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        toast.error(res.error);
        return;
      }

      toast.success(res.message ?? "Pengaturan toko & pembayaran disimpan.");
      router.refresh();
    });
  }

  const normalizedWa = sanitizePhone(whatsapp);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-hover">Konfigurasi</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-orchard">Pembayaran &amp; Info Toko</h1>
        </div>
        <Button type="submit" variant="gold" disabled={pending}>
          <Save className="size-4" />
          {pending ? "Menyimpan…" : "Simpan Pengaturan"}
        </Button>
      </div>

      {formError ? (
        <div role="alert" className="rounded-2xl border border-crimson/25 bg-crimson/10 px-4 py-3 text-xs font-medium text-crimson">
          {formError}
        </div>
      ) : null}

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">Identitas, Kontak &amp; Lokasi</TabsTrigger>
          <TabsTrigger value="payment">Metode Pembayaran (DANA, COD, Kebun)</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-5">
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
                hint={`Format otomatis ke 62xxx → ${normalizedWa ? prettyPhone(normalizedWa) : "—"}`}
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
          </div>
        </TabsContent>

        <TabsContent value="payment" className="mt-5">
          <div className="space-y-5">
            <FieldError messages={fieldErrors.payment_dana_enabled} />

            {/* DANA */}
            <section className="space-y-4 rounded-3xl border border-orchard/10 bg-white/85 p-6 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-orchard">Transfer DANA (+ Bukti Transfer)</h2>
                  <p className="text-xs text-moss">
                    Pembeli dapat menyalin nomor DANA dan mengunggah foto bukti transfer saat checkout atau di invoice.
                  </p>
                </div>
                <Switch checked={danaEnabled} onCheckedChange={setDanaEnabled} aria-label="Aktifkan DANA" />
              </div>

              {danaEnabled ? (
                <div className="grid gap-4 border-t border-orchard/10 pt-4 sm:grid-cols-2">
                  <Field label="Nomor Akun DANA" htmlFor="pay-dana-num" error={fieldErrors.payment_dana_number}>
                    <Input
                      id="pay-dana-num"
                      value={danaNumber}
                      onChange={(e) => setDanaNumber(e.target.value)}
                      placeholder="081391094308"
                      className="font-mono"
                    />
                  </Field>
                  <Field label="Nama Pemilik Akun DANA" htmlFor="pay-dana-hold" error={fieldErrors.payment_dana_holder}>
                    <Input
                      id="pay-dana-hold"
                      value={danaHolder}
                      onChange={(e) => setDanaHolder(e.target.value)}
                      placeholder="Durian Pak Agung"
                    />
                  </Field>
                  <Field
                    label="Instruksi Pembayaran DANA"
                    htmlFor="pay-dana-inst"
                    error={fieldErrors.payment_dana_instructions}
                    className="sm:col-span-2"
                  >
                    <Textarea
                      id="pay-dana-inst"
                      value={danaInstructions}
                      onChange={(e) => setDanaInstructions(e.target.value)}
                      className="min-h-20"
                    />
                  </Field>
                </div>
              ) : null}
            </section>

            {/* COD */}
            <section className="space-y-4 rounded-3xl border border-orchard/10 bg-white/85 p-6 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-orchard">COD (Bayar di Tempat)</h2>
                  <p className="text-xs text-moss">Aktif untuk pembeli yang memilih antar kurir lokal.</p>
                </div>
                <Switch checked={codEnabled} onCheckedChange={setCodEnabled} aria-label="Aktifkan COD" />
              </div>

              {codEnabled ? (
                <div className="border-t border-orchard/10 pt-4">
                  <Field label="Catatan COD untuk Pembeli" htmlFor="pay-cod" error={fieldErrors.payment_cod_notes}>
                    <Textarea
                      id="pay-cod"
                      value={codNotes}
                      onChange={(e) => setCodNotes(e.target.value)}
                      className="min-h-18"
                    />
                  </Field>
                </div>
              ) : null}
            </section>

            {/* Pickup */}
            <section className="space-y-4 rounded-3xl border border-orchard/10 bg-white/85 p-6 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-orchard">Ambil &amp; Bayar di Tempat</h2>
                  <p className="text-xs text-moss">Untuk pembeli yang datang langsung ke lapak Karangmangu, Sigaluh.</p>
                </div>
                <Switch checked={pickupEnabled} onCheckedChange={setPickupEnabled} aria-label="Aktifkan Ambil di Tempat" />
              </div>

              {pickupEnabled ? (
                <div className="border-t border-orchard/10 pt-4">
                  <Field label="Catatan Ambil di Kebun" htmlFor="pay-pickup" error={fieldErrors.payment_pickup_notes}>
                    <Textarea
                      id="pay-pickup"
                      value={pickupNotes}
                      onChange={(e) => setPickupNotes(e.target.value)}
                      className="min-h-18"
                    />
                  </Field>
                </div>
              ) : null}
            </section>
          </div>
        </TabsContent>
      </Tabs>
    </form>
  );
}
