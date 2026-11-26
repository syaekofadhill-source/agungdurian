"use client";

import { ArrowRight, MapPin, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { TasteMeter } from "@/components/motion/taste-meter";
import { DualModeConfigurator } from "@/components/store/dual-mode-configurator";
import { ProductImage } from "@/components/store/product-image";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { getCategoryLabel } from "@/lib/constants";
import type { CustomOption, Product } from "@/types/database";

export function ProductDetailModal({
  product,
  customOptions,
  gramPresets,
  onOpenChange,
}: {
  product: Product | null;
  customOptions?: CustomOption[];
  gramPresets?: number[];
  onOpenChange: (open: boolean) => void;
}) {
  const categories = customOptions?.filter((o) => o.option_type === "category");
  return (
    <Dialog open={product !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl overflow-hidden p-0">
        {product ? (
          <div className="grid md:grid-cols-12">
            <div className="relative min-h-64 bg-orchard md:col-span-5">
              <ProductImage
                src={product.image_url}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 95vw, 320px"
                className="object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-orchard/85 via-orchard/15 to-transparent" />
              <div className="absolute inset-x-4 bottom-4 space-y-2 text-cream">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-cream/15 px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur">
                    {getCategoryLabel(product.variety_category, categories)}
                  </span>
                  {product.badge ? (
                    <span className="rounded-full bg-gold px-2.5 py-0.5 text-[11px] font-bold text-orchard">
                      {product.badge}
                    </span>
                  ) : null}
                </div>
                {product.origin_notes ? (
                  <p className="flex items-start gap-1.5 text-xs leading-relaxed text-cream/85">
                    <MapPin className="mt-0.5 size-3.5 shrink-0 text-gold" />
                    <span>{product.origin_notes}</span>
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-5 p-6 md:col-span-7">
              <div className="pr-8">
                <DialogTitle className="font-display text-2xl font-bold text-orchard">
                  {product.name}
                </DialogTitle>
                <DialogDescription className="mt-1.5 text-sm leading-relaxed text-moss">
                  {product.description}
                </DialogDescription>
              </div>

              <div className="rounded-2xl border border-orchard/10 bg-cream-2/60 p-4">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-orchard">
                  Profil Rasa Kebun
                </p>
                <TasteMeter
                  compact
                  profile={{
                    sweet: product.taste_sweet,
                    creamy: product.taste_creamy,
                    bitter: product.taste_bitter,
                    thickness: product.taste_thickness,
                  }}
                />
              </div>

              <DualModeConfigurator
                key={product.id}
                product={product}
                variant="full"
                customOptions={customOptions}
                gramPresets={gramPresets}
                onAdded={() => onOpenChange(false)}
              />

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-orchard/10 pt-3 text-xs">
                <span className="inline-flex items-center gap-1.5 font-medium text-orchard">
                  <ShieldCheck className="size-4 text-gold-hover" />
                  Garansi ganti baru jika hambar / mentah
                </span>
                <Link
                  href={`/produk/${product.slug}`}
                  onClick={() => onOpenChange(false)}
                  className="inline-flex items-center gap-1 font-semibold text-orchard underline-offset-4 hover:underline"
                >
                  Halaman penuh <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
