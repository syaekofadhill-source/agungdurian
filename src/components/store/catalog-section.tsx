"use client";

import { motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Reveal } from "@/components/motion/reveal";
import { ProductCard } from "@/components/store/product-card";
import { ProductDetailModal } from "@/components/store/product-detail-modal";
import { CATEGORY_FILTERS } from "@/lib/constants";
import { MOCK_CUSTOM_OPTIONS, MOCK_SETTINGS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { CustomOption, Product } from "@/types/database";

export function CatalogSection({
  products,
  customOptions = MOCK_CUSTOM_OPTIONS,
  gramPresets = MOCK_SETTINGS.gram_presets_json,
}: {
  products: Product[];
  customOptions?: CustomOption[];
  gramPresets?: number[];
}) {
  const [category, setCategory] = useState<string>("semua");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);

  const categoryTabs = useMemo(() => {
    const dbCats = customOptions.filter((o) => o.option_type === "category" && o.is_active);
    if (dbCats.length === 0) return CATEGORY_FILTERS;
    return [
      { value: "semua", label: "Semua" },
      ...dbCats.map((c) => ({ value: c.code, label: c.name })),
    ];
  }, [customOptions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== "semua" && p.variety_category !== category) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.badge?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [products, category, query]);

  return (
    <section id="katalog" className="grain relative py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-hover">
              Panen Kebun Sigaluh
            </p>
            <h2 className="font-display text-3xl font-semibold text-orchard sm:text-4xl">
              Pilih varietas favorit, beli per butir atau per gram.
            </h2>
            <p className="text-sm leading-relaxed text-moss sm:text-base">
              Setiap kartu produk punya sakelar ganda: atur ukuran buah utuh atau geser gramasi daging kupas siap
              santap secara langsung.
            </p>
          </div>

          <div className="relative w-full lg:w-80">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-moss" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari Bawor, Musang King, Kupas…"
              aria-label="Cari produk durian"
              className="h-11 w-full rounded-full border border-orchard/15 bg-white/85 pl-10 pr-10 text-sm text-bark placeholder:text-moss/60 outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/20"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-moss hover:bg-cream-2"
                aria-label="Hapus pencarian"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>
        </Reveal>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-orchard/10 pb-5">
          <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Filter kategori durian">
            {categoryTabs.map((tab) => {
              const active = category === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setCategory(tab.value)}
                  className={cn(
                    "relative z-10 rounded-full px-4 py-2 text-xs font-semibold transition-colors",
                    active ? "text-cream" : "text-moss hover:bg-cream-2 hover:text-orchard",
                  )}
                >
                  {active ? (
                    <motion.span
                      layoutId="catalog-cat-pill"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      className="absolute inset-0 -z-10 rounded-full bg-orchard shadow-soft"
                    />
                  ) : null}
                  {tab.label}
                </button>
              );
            })}
          </div>
          <p className="font-mono text-xs text-moss tabular">
            Menampilkan {filtered.length} dari {products.length} varietas
          </p>
        </div>

        {filtered.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                customOptions={customOptions}
                gramPresets={gramPresets}
                onOpenDetail={setSelected}
              />
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-3xl border border-orchard/10 bg-white/70 p-10 text-center">
            <p className="font-display text-xl font-semibold text-orchard">Varietas tidak ditemukan</p>
            <p className="mt-1.5 text-sm text-moss">
              Tidak ada durian yang cocok dengan kata kunci atau kategori yang dipilih.
            </p>
            <button
              type="button"
              onClick={() => {
                setCategory("semua");
                setQuery("");
              }}
              className="mt-5 inline-flex h-10 items-center rounded-full bg-orchard px-5 text-xs font-semibold text-cream transition hover:bg-orchard-2"
            >
              Tampilkan Semua Varietas
            </button>
          </div>
        )}
      </div>

      <ProductDetailModal
        product={selected}
        customOptions={customOptions}
        gramPresets={gramPresets}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </section>
  );
}
