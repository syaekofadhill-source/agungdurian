"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { TasteMeter } from "@/components/motion/taste-meter";
import { ProductDetailModal } from "@/components/store/product-detail-modal";
import { ProductImage } from "@/components/store/product-image";
import { isSoldOut, startingPrice } from "@/lib/pricing";
import { cn, formatRupiah } from "@/lib/utils";
import type { CustomOption, Product } from "@/types/database";

type TastePref = "manis_legit" | "pahit_kompleks" | "manis_tebal" | "seimbang";
type FormatPref = "semua" | "butir" | "gram";

const TASTE_OPTIONS: ReadonlyArray<{ id: TastePref; title: string; hint: string }> = [
  { id: "manis_legit", title: "Manis Legit & Creamy", hint: "Lumer di lidah seperti custard" },
  { id: "pahit_kompleks", title: "Pahit Manis Kompleks", hint: "Aroma tajam & aftertaste dalam" },
  { id: "manis_tebal", title: "Manis Pekat & Tebal", hint: "Porsi puas untuk keluarga" },
  { id: "seimbang", title: "Klasik Seimbang", hint: "Manis-pahit pas khas Sigaluh" },
];

const FORMAT_OPTIONS: ReadonlyArray<{ id: FormatPref; label: string }> = [
  { id: "semua", label: "Format Bebas" },
  { id: "butir", label: "Per Butir Utuh" },
  { id: "gram", label: "Kupas per Gram" },
];

function scoreProduct(p: Product, pref: TastePref): number {
  switch (pref) {
    case "manis_legit":
      return p.taste_sweet * 1.1 + p.taste_creamy * 1.6 + p.taste_thickness * 0.9 - p.taste_bitter * 0.2;
    case "pahit_kompleks":
      return p.taste_bitter * 1.9 + p.taste_creamy * 1.2 + p.taste_sweet * 0.6;
    case "manis_tebal":
      return p.taste_sweet * 1.5 + p.taste_thickness * 1.7 - p.taste_bitter * 0.6;
    case "seimbang": {
      const balance = 5 - Math.abs(p.taste_sweet - p.taste_bitter);
      return balance * 1.3 + p.taste_creamy + p.taste_sweet * 0.7;
    }
  }
}

export function DurianRecommender({
  products,
  customOptions,
  gramPresets,
}: {
  products: Product[];
  customOptions?: CustomOption[];
  gramPresets?: number[];
}) {
  const [tastePref, setTastePref] = useState<TastePref>("manis_legit");
  const [formatPref, setFormatPref] = useState<FormatPref>("semua");
  const [modalProduct, setModalProduct] = useState<Product | null>(null);

  const recommendations = useMemo(() => {
    const candidates = products.filter((p) => {
      if (isSoldOut(p)) return false;
      if (formatPref === "butir") return p.allow_butir && p.stock_butir > 0;
      if (formatPref === "gram") return p.allow_gram && p.stock_gram >= p.min_gram;
      return true;
    });

    return [...candidates]
      .sort((a, b) => scoreProduct(b, tastePref) - scoreProduct(a, tastePref))
      .slice(0, 3);
  }, [products, tastePref, formatPref]);

  return (
    <section id="rekomendasi" className="relative overflow-hidden bg-orchard-2 py-16 text-cream sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-start gap-10 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-5">
            <div className="space-y-2.5">
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-gold">
                <Sparkles className="size-3.5" />
                Panduan Pilih Rasa
              </p>
              <h2 className="font-display text-3xl font-semibold leading-tight text-cream sm:text-4xl">
                Bingung pilih varietas? Cocokkan dengan selera Anda.
              </h2>
              <p className="text-sm leading-relaxed text-cream/75">
                Pilih karakter rasa yang paling Anda sukai, sistem kebun langsung menyaring stok terbaik yang tersedia
                hari ini.
              </p>
            </div>

            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-custard/80">1. Karakter Rasa</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
                {TASTE_OPTIONS.map((opt) => {
                  const active = tastePref === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTastePref(opt.id)}
                      className={cn(
                        "rounded-2xl border px-4 py-3 text-left transition",
                        active
                          ? "border-gold bg-gold/15 ring-1 ring-gold"
                          : "border-cream/12 bg-orchard/50 hover:border-cream/30",
                      )}
                    >
                      <span className="block text-sm font-semibold text-cream">{opt.title}</span>
                      <span className="block text-xs text-cream/65">{opt.hint}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-custard/80">2. Format Pembelian</p>
              <div className="flex flex-wrap gap-2">
                {FORMAT_OPTIONS.map((f) => {
                  const active = formatPref === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFormatPref(f.id)}
                      className={cn(
                        "rounded-full px-4 py-2 text-xs font-semibold transition",
                        active
                          ? "bg-gold text-orchard"
                          : "border border-cream/15 bg-orchard/50 text-cream/80 hover:border-cream/35",
                      )}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-4 lg:col-span-7">
            <div className="flex items-center justify-between text-xs text-cream/70">
              <span>Rekomendasi terbaik dari stok aktif</span>
              <span className="font-mono tabular">{recommendations.length} pilihan</span>
            </div>

            {recommendations.length > 0 ? (
              <div className="grid gap-4">
                {recommendations.map((item, idx) => (
                  <div
                    key={item.id}
                    className={cn(
                      "grid items-center gap-5 rounded-3xl border p-4 transition sm:grid-cols-[9rem_1fr] sm:p-5",
                      idx === 0
                        ? "border-gold/50 bg-orchard/85 shadow-lift"
                        : "border-cream/12 bg-orchard/55 hover:border-cream/25",
                    )}
                  >
                    <div className="relative aspect-square overflow-hidden rounded-2xl bg-orchard">
                      <ProductImage
                        src={item.image_url}
                        alt={item.name}
                        fill
                        sizes="160px"
                      />
                      {idx === 0 ? (
                        <span className="absolute left-2 top-2 rounded-full bg-gold px-2.5 py-0.5 text-[10px] font-bold text-orchard">
                          Paling Cocok
                        </span>
                      ) : null}
                    </div>

                    <div className="space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <Link
                            href={`/produk/${item.slug}`}
                            className="font-display text-xl font-semibold text-cream transition hover:text-gold"
                          >
                            {item.name}
                          </Link>
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-cream/75">{item.description}</p>
                        </div>
                        <div className="text-right">
                          <span className="block text-[10px] uppercase tracking-wider text-cream/55">Mulai</span>
                          <span className="font-mono text-base font-bold text-custard tabular">
                            {formatRupiah(startingPrice(item))}
                          </span>
                        </div>
                      </div>

                      <TasteMeter
                        tone="dark"
                        compact
                        profile={{
                          sweet: item.taste_sweet,
                          creamy: item.taste_creamy,
                          bitter: item.taste_bitter,
                          thickness: item.taste_thickness,
                        }}
                      />

                      <div className="flex flex-wrap items-center gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setModalProduct(item)}
                          className="inline-flex h-9 items-center rounded-full bg-gold px-4 text-xs font-semibold text-orchard transition hover:bg-gold-hover"
                        >
                          Atur &amp; Pesan Cepat
                        </button>
                        <Link
                          href={`/produk/${item.slug}`}
                          className="inline-flex h-9 items-center gap-1 rounded-full border border-cream/20 px-4 text-xs font-semibold text-cream transition hover:border-gold/60 hover:text-gold"
                        >
                          Lihat Detail <ArrowRight className="size-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-cream/15 bg-orchard/60 p-8 text-center text-sm text-cream/75">
                Belum ada stok yang sesuai dengan filter format saat ini. Coba pilih &ldquo;Format Bebas&rdquo;.
              </div>
            )}
          </div>
        </div>
      </div>

      <ProductDetailModal
        product={modalProduct}
        customOptions={customOptions}
        gramPresets={gramPresets}
        onOpenChange={(open) => {
          if (!open) setModalProduct(null);
        }}
      />
    </section>
  );
}
