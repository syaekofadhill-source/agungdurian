"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowDownRight, Compass, MapPin, PackageCheck, Scale } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

import { PollenParticles } from "@/components/motion/pollen-particles";
import { RollingNumber } from "@/components/motion/rolling-number";
import { RotatingSeal } from "@/components/motion/rotating-seal";
import { LiveDot } from "@/components/store/announcement-bar";
import { ContourLines, StarRow } from "@/components/store/ornaments";
import { buttonVariants } from "@/components/ui/button";
import { HARVEST_STATUS_META } from "@/lib/constants";
import { butirUnitPrice, gramBasePrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { Product, SellMode, StoreSettings } from "@/types/database";

export function HeroSection({ settings, products }: { settings: StoreSettings; products: Product[] }) {
  const heroRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const parallaxY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, 44]);

  const previewProduct =
    products.find((p) => p.allow_butir && p.allow_gram && p.is_featured) ??
    products.find((p) => p.allow_butir && p.allow_gram) ??
    products[0];

  const [previewMode, setPreviewMode] = useState<SellMode>(
    previewProduct?.allow_butir ? "butir" : "gram",
  );

  const statusMeta = HARVEST_STATUS_META[settings.harvest_status];

  const previewPrice = previewProduct
    ? previewMode === "butir" && previewProduct.allow_butir
      ? butirUnitPrice(previewProduct, "sedang")
      : gramBasePrice(previewProduct, 500)
    : 0;

  return (
    <section
      ref={heroRef}
      className="relative overflow-hidden bg-orchard-radial text-cream"
    >
      <ContourLines className="pointer-events-none -left-48 -top-36 absolute size-[640px] text-cream/[0.06]" />
      <PollenParticles className="pointer-events-none absolute inset-0 overflow-hidden" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:pb-24 lg:pt-16">
        <div className="space-y-7 lg:col-span-7">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-cream/15 bg-cream/[0.07] px-3.5 py-1.5 text-xs font-semibold tracking-wide text-custard backdrop-blur-sm">
              <LiveDot tone={statusMeta.tone} />
              {statusMeta.label} · Kebun Sigaluh
            </span>
            <a
              href="#testimoni"
              className="inline-flex items-center gap-2 rounded-full border border-cream/15 bg-orchard-2/80 px-3.5 py-1.5 text-xs text-cream/90 transition hover:border-gold/50"
            >
              <StarRow rating={settings.google_rating} className="text-cream" />
              <span className="font-mono font-semibold tabular text-gold">{settings.google_rating}</span>
              <span className="text-cream/70">({settings.google_review_count} ulasan Google)</span>
            </a>
          </div>

          <div className="space-y-4">
            <h1 className="font-display text-4xl font-semibold leading-[1.06] tracking-tight text-balance text-cream sm:text-5xl lg:text-[3.55rem]">
              {settings.hero_headline}
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-pretty text-cream/80 sm:text-lg">
              {settings.hero_subheadline}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3.5">
            <Link href="#katalog" className={buttonVariants({ variant: "gold", size: "lg" })}>
              Jelajahi Katalog Panen
              <ArrowDownRight className="size-4" />
            </Link>
            <Link
              href="#rekomendasi"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "border-cream/25 text-cream hover:border-gold/60 hover:bg-cream/10",
              )}
            >
              <Compass className="size-4 text-gold" />
              Cari Rasa yang Cocok
            </Link>
          </div>

          {previewProduct ? (
            <div className="max-w-xl rounded-3xl border border-cream/15 bg-orchard-2/80 p-4 shadow-lift backdrop-blur-md sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">
                    Dua Cara Beli · {previewProduct.name}
                  </p>
                  <p className="mt-0.5 text-xs text-cream/70">
                    Pilih utuh per buah atau daging kupas per gram sesuai kebutuhan Anda.
                  </p>
                </div>
                {previewProduct.allow_butir && previewProduct.allow_gram ? (
                  <div className="relative inline-grid grid-cols-2 rounded-full bg-orchard p-1 ring-1 ring-cream/15">
                    {(["butir", "gram"] as const).map((m) => {
                      const active = previewMode === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setPreviewMode(m)}
                          className={cn(
                            "relative z-10 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                            active ? "text-orchard" : "text-cream/75 hover:text-cream",
                          )}
                        >
                          {active ? (
                            <motion.span
                              layoutId="hero-mode-pill"
                              transition={{ type: "spring", stiffness: 380, damping: 30 }}
                              className="absolute inset-0 -z-10 rounded-full bg-gold"
                            />
                          ) : null}
                          {m === "butir" ? "Per Butir" : "Per Gram"}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-cream/10 pt-3.5">
                <div className="flex items-center gap-3 text-xs text-cream/80">
                  <span className="grid size-8 place-items-center rounded-xl bg-cream/10 text-gold">
                    {previewMode === "butir" ? <PackageCheck className="size-4" /> : <Scale className="size-4" />}
                  </span>
                  <div>
                    <p className="font-semibold text-cream">
                      {previewMode === "butir"
                        ? `Utuh Sedang (±${previewProduct.avg_weight_kg.toLocaleString("id-ID")} kg)`
                        : "Daging Kupas · 500g"}
                    </p>
                    <p className="text-[11px] text-cream/65">
                      {previewMode === "butir"
                        ? "Bisa kirim utuh atau minta dibukakan rapi"
                        : "Thinwall segar atau Vacuum Pack luar kota"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="block text-[10px] uppercase tracking-wider text-cream/60">Estimasi</span>
                    <RollingNumber value={previewPrice} prefix="Rp" className="text-xl font-bold text-custard" />
                  </div>
                  <Link
                    href={`/produk/${previewProduct.slug}`}
                    className="rounded-full bg-cream/10 px-3.5 py-2 text-xs font-semibold text-cream ring-1 ring-cream/20 transition hover:bg-gold hover:text-orchard"
                  >
                    Atur
                  </Link>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="relative lg:col-span-5">
          <motion.div style={{ y: parallaxY }} className="relative mx-auto max-w-md lg:max-w-none">
            <div className="relative aspect-[4/4.5] overflow-hidden rounded-[2.25rem] border border-cream/15 bg-orchard-2 shadow-lift">
              <Image
                src="/images/hero.webp"
                alt="Durian matang pohon dibelah di atas daun pisang dari kebun AgungDurian Sigaluh"
                fill
                priority
                sizes="(max-width: 1024px) 92vw, 42vw"
                className="object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-orchard/75 via-transparent to-transparent" />
              <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-2 rounded-2xl border border-cream/15 bg-orchard/80 px-4 py-3 backdrop-blur-md">
                <div className="flex items-center gap-2.5 text-xs">
                  <MapPin className="size-4 shrink-0 text-gold" />
                  <div>
                    <p className="font-semibold text-cream">Karangmangu, Sigaluh</p>
                    <p className="text-[11px] text-cream/70">Banjarnegara · Lereng ±480 mdpl</p>
                  </div>
                </div>
                <span className="rounded-full bg-gold/20 px-2.5 py-1 font-mono text-[11px] font-semibold text-custard">
                  Garansi Manis
                </span>
              </div>
            </div>

            <div className="pointer-events-none -right-3 -top-8 absolute z-10 text-custard drop-shadow-md sm:-right-7 sm:-top-10">
              <RotatingSeal size={136} />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
