"use client";

import { Eye } from "lucide-react";
import Link from "next/link";

import { MagneticCard } from "@/components/motion/magnetic-card";
import { DualModeConfigurator } from "@/components/store/dual-mode-configurator";
import { ProductImage } from "@/components/store/product-image";
import { getCategoryLabel, LOW_STOCK_BUTIR, LOW_STOCK_GRAM } from "@/lib/constants";
import { isSoldOut } from "@/lib/pricing";
import type { CustomOption, Product } from "@/types/database";

export function ProductCard({
  product,
  customOptions,
  gramPresets,
  onOpenDetail,
}: {
  product: Product;
  customOptions?: CustomOption[];
  gramPresets?: number[];
  onOpenDetail: (product: Product) => void;
}) {
  const categories = customOptions?.filter((o) => o.option_type === "category");
  const soldOut = isSoldOut(product);
  const lowButir = product.allow_butir && product.stock_butir > 0 && product.stock_butir <= LOW_STOCK_BUTIR;
  const lowGram =
    product.allow_gram && product.stock_gram >= product.min_gram && product.stock_gram <= LOW_STOCK_GRAM;
  const isLow = !soldOut && (lowButir || lowGram);

  return (
    <MagneticCard strength={7} className="h-full">
      <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-orchard/10 bg-white/80 shadow-soft backdrop-blur-sm transition-shadow duration-300 hover:shadow-lift">
        <div className="relative aspect-[4/3] overflow-hidden bg-orchard">
          <Link href={`/produk/${product.slug}`} className="block size-full">
            <ProductImage
              src={product.image_url}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 95vw, (max-width: 1200px) 48vw, 32vw"
              className="transition-transform duration-700 ease-[var(--ease-organic)] group-hover:scale-105"
            />
          </Link>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-orchard/55 via-transparent to-orchard/20" />

          <div className="absolute left-3.5 top-3.5 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-orchard/80 px-2.5 py-1 text-[10.5px] font-semibold text-cream backdrop-blur-sm">
              {getCategoryLabel(product.variety_category, categories)}
            </span>
            {product.badge ? (
              <span className="rounded-full bg-gold px-2.5 py-1 text-[10.5px] font-bold text-orchard shadow-sm">
                {product.badge}
              </span>
            ) : null}
          </div>

          {soldOut ? (
            <span className="absolute right-3.5 top-3.5 rounded-full bg-crimson px-2.5 py-1 text-[10.5px] font-bold text-white shadow-sm">
              Habis
            </span>
          ) : isLow ? (
            <span className="absolute right-3.5 top-3.5 rounded-full bg-crimson/90 px-2.5 py-1 text-[10.5px] font-semibold text-white shadow-sm">
              Stok Terbatas
            </span>
          ) : null}

          <button
            type="button"
            onClick={() => onOpenDetail(product)}
            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-cream/95 px-3 py-1.5 text-[11.5px] font-semibold text-orchard shadow-soft backdrop-blur-sm transition hover:bg-gold"
          >
            <Eye className="size-3.5" />
            <span>Detail &amp; Rasa</span>
          </button>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div>
            <Link
              href={`/produk/${product.slug}`}
              className="font-display text-xl font-bold leading-snug text-orchard transition-colors hover:text-gold-hover"
            >
              {product.name}
            </Link>
            <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-moss">{product.description}</p>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5 text-[10.5px] font-medium text-orchard">
            <span className="rounded-full bg-cream-2 px-2.5 py-0.5 font-mono tabular">
              Manis {product.taste_sweet}/5
            </span>
            <span className="rounded-full bg-cream-2 px-2.5 py-0.5 font-mono tabular">
              Legit {product.taste_creamy}/5
            </span>
            <span className="rounded-full bg-cream-2 px-2.5 py-0.5 font-mono tabular">
              Pahit {product.taste_bitter}/5
            </span>
          </div>

          <div className="mt-auto pt-4">
            <DualModeConfigurator
              product={product}
              variant="compact"
              customOptions={customOptions}
              gramPresets={gramPresets}
            />
          </div>
        </div>
      </article>
    </MagneticCard>
  );
}
