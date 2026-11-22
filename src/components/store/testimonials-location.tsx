import { ArrowUpRight, Clock, MapPin, MessageCircle, Quote } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import { ContourLines, InstagramIcon, LeafSprig, StarRow } from "@/components/store/ornaments";
import { buttonVariants } from "@/components/ui/button";
import { cn, prettyPhone } from "@/lib/utils";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import type { StoreSettings, Testimonial } from "@/types/database";

export function TestimonialsLocation({
  settings,
  testimonials,
}: {
  settings: StoreSettings;
  testimonials: Testimonial[];
}) {
  const waUrl = buildWhatsAppUrl(
    settings.whatsapp_number,
    `Halo ${settings.store_name}, saya berencana berkunjung atau memesan durian.`,
  );

  return (
    <>
      <section id="testimoni" className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-xl space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-hover">
                Cerita Pembeli
              </p>
              <h2 className="font-display text-3xl font-semibold text-orchard sm:text-4xl">
                Rasa yang membuat pelanggan kembali setiap musim panen.
              </h2>
            </div>

            <div className="inline-flex items-center gap-3 self-start rounded-2xl border border-orchard/10 bg-white/80 px-4 py-3 shadow-soft">
              <StarRow rating={settings.google_rating} className="text-bark" />
              <div className="text-xs">
                <span className="font-mono text-sm font-bold text-orchard tabular">
                  {settings.google_rating}/5
                </span>{" "}
                <span className="text-moss">· {settings.google_review_count} ulasan Google</span>
              </div>
            </div>
          </Reveal>

          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
            {testimonials.map((t, i) => (
              <Reveal
                key={t.id}
                delay={i * 0.05}
                className="flex flex-col justify-between rounded-3xl border border-orchard/10 bg-white/80 p-6 shadow-soft sm:p-7"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <StarRow rating={t.rating} className="text-bark" />
                    <Quote className="size-5 text-gold/70" aria-hidden />
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-bark/90 sm:text-[15px]">
                    &ldquo;{t.comment}&rdquo;
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-orchard/10 pt-4">
                  <div>
                    <p className="font-display text-base font-semibold text-orchard">{t.customer_name}</p>
                    {t.origin_city ? <p className="text-xs text-moss">{t.origin_city}</p> : null}
                  </div>
                  {t.purchased_variant ? (
                    <span className="rounded-full bg-cream-2 px-3 py-1 text-[11px] font-medium text-orchard">
                      {t.purchased_variant}
                    </span>
                  ) : null}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="lokasi" className="pb-20 pt-4 sm:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal className="overflow-hidden rounded-[2.25rem] border border-orchard/10 bg-orchard text-cream shadow-lift">
            <div className="grid lg:grid-cols-12">
              <div className="space-y-6 p-7 sm:p-10 lg:col-span-7 lg:p-12">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
                    Kunjungi Kebun &amp; Gerai
                  </p>
                  <h2 className="mt-2 font-display text-3xl font-semibold text-cream sm:text-4xl">
                    Mampir makan durian segar di {settings.store_name}.
                  </h2>
                  <p className="mt-2.5 text-sm leading-relaxed text-cream/75">
                    Pilih buah langsung dari keranjang panen pagi, minta Pak Agung pilihkan yang paling legit, dan
                    nikmati di saung kebun kami.
                  </p>
                </div>

                <dl className="grid gap-4 border-y border-cream/12 py-5 text-sm sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-gold" />
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-cream/55">Alamat</dt>
                      <dd className="mt-1 leading-relaxed text-cream/90">{settings.address}</dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="mt-0.5 size-4 shrink-0 text-gold" />
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-cream/55">Jam Buka</dt>
                      <dd className="mt-1 text-cream/90">{settings.opening_hours}</dd>
                      {settings.instagram_handle ? (
                        <dd className="mt-1.5 flex items-center gap-1.5 text-xs text-custard">
                          <InstagramIcon className="size-3.5" />
                          @{settings.instagram_handle}
                        </dd>
                      ) : null}
                    </div>
                  </div>
                </dl>

                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={settings.maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({ variant: "gold", size: "lg" })}
                  >
                    Petunjuk Arah (Google Maps)
                    <ArrowUpRight className="size-4" />
                  </a>
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "lg" }),
                      "border-cream/25 text-cream hover:border-gold hover:bg-cream/10",
                    )}
                  >
                    <MessageCircle className="size-4 text-gold" />
                    <span>WhatsApp {prettyPhone(settings.whatsapp_number)}</span>
                  </a>
                </div>
              </div>

              <div className="relative flex min-h-72 flex-col justify-between overflow-hidden bg-orchard-2 p-7 sm:p-10 lg:col-span-5">
                <ContourLines className="pointer-events-none absolute -right-24 -top-24 size-[520px] text-cream/15" />
                <LeafSprig className="pointer-events-none -bottom-10 -left-8 absolute size-52 text-cream opacity-10" />

                <div className="relative flex items-center justify-between">
                  <span className="rounded-full bg-cream/10 px-3 py-1 font-mono text-[11px] text-custard backdrop-blur">
                    -7.4021° S, 109.7492° E
                  </span>
                  <span className="rounded-full bg-gold px-3 py-1 text-[11px] font-bold text-orchard">
                    Sigaluh · Banjarnegara
                  </span>
                </div>

                <div className="relative mt-10 rounded-2xl border border-cream/15 bg-orchard/80 p-5 backdrop-blur-md">
                  <p className="font-display text-lg font-semibold text-cream">Jalur Wisata Dieng – Banjarnegara</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-cream/75">
                    Berada di jalan utama Karangmangu, Sigaluh — mudah dijangkau kendaraan keluarga dan rombongan wisata
                    menuju dataran tinggi Dieng.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
