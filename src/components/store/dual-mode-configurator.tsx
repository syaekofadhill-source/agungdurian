"use client";

import { motion } from "framer-motion";
import { Check, Minus, Package, Plus, Scale, ShoppingBag } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";

import { RollingNumber } from "@/components/motion/rolling-number";
import { Slider } from "@/components/ui/slider";
import {
  BUTIR_PREPARATION_LABEL,
  BUTIR_SIZES,
  GRAM_PACKAGING_META,
  GRAM_PRESETS,
  GRAM_STEP,
  LOW_STOCK_BUTIR,
  LOW_STOCK_GRAM,
} from "@/lib/constants";
import { butirUnitPrice, butirWeightKg, gramUnitPrice } from "@/lib/pricing";
import { cn, formatGram, formatNumber, formatRupiah } from "@/lib/utils";
import { useCartStore } from "@/stores/cart";
import type { ButirPreparation, ButirSize, GramPackaging, Product, SellMode } from "@/types/database";

function getInitialMode(product: Product): SellMode {
  if (product.allow_butir && (product.stock_butir > 0 || !product.allow_gram)) return "butir";
  if (product.allow_gram) return "gram";
  return "butir";
}

function getEffectiveMaxGram(product: Product): number {
  const rawUpper =
    product.stock_gram >= product.min_gram
      ? Math.min(product.max_gram, product.stock_gram)
      : product.max_gram;
  const snapped = Math.floor(rawUpper / GRAM_STEP) * GRAM_STEP;
  return Math.max(product.min_gram, snapped);
}

function getInitialGrams(product: Product): number {
  const max = getEffectiveMaxGram(product);
  const preferred = 500;
  if (preferred >= product.min_gram && preferred <= max) return preferred;
  return Math.min(max, Math.max(product.min_gram, Math.round(max / GRAM_STEP) * GRAM_STEP));
}

export function DualModeConfigurator({
  product,
  variant = "compact",
  onAdded,
}: {
  product: Product;
  variant?: "compact" | "full";
  onAdded?: () => void;
}) {
  const uid = useId().replace(/:/g, "");
  const addLine = useCartStore((s) => s.addLine);
  const openCart = useCartStore((s) => s.open);

  const [mode, setMode] = useState<SellMode>(() => getInitialMode(product));
  const [size, setSize] = useState<ButirSize>("sedang");
  const [preparation, setPreparation] = useState<ButirPreparation>("utuh");
  const [grams, setGrams] = useState<number>(() => getInitialGrams(product));
  const [packaging, setPackaging] = useState<GramPackaging>("thinwall");
  const [quantity, setQuantity] = useState<number>(1);

  const canButir = product.allow_butir;
  const canGram = product.allow_gram;
  const activeMode: SellMode = mode === "butir" && !canButir ? "gram" : mode === "gram" && !canGram ? "butir" : mode;

  const effectiveMaxGram = getEffectiveMaxGram(product);
  const clampedGrams = Math.min(effectiveMaxGram, Math.max(product.min_gram, grams));

  const butirInStock = canButir && product.stock_butir > 0;
  const gramInStock = canGram && product.stock_gram >= product.min_gram;
  const isAvailable = activeMode === "butir" ? butirInStock : gramInStock;

  const maxQuantity =
    activeMode === "butir"
      ? Math.max(1, product.stock_butir)
      : Math.max(1, Math.min(20, Math.floor(product.stock_gram / clampedGrams)));

  const safeQty = Math.min(quantity, maxQuantity);
  const unitPrice =
    activeMode === "butir"
      ? butirUnitPrice(product, size)
      : gramUnitPrice(product, clampedGrams, packaging);

  function handleModeChange(next: SellMode) {
    setMode(next);
    setQuantity(1);
  }

  function handleAdd() {
    if (!isAvailable) return;

    if (activeMode === "butir") {
      addLine({
        mode: "butir",
        productId: product.id,
        slug: product.slug,
        name: product.name,
        imageUrl: product.image_url,
        unitPrice,
        size,
        preparation,
        maxQuantity: product.stock_butir,
        quantity: safeQty,
      });
      toast.success(`${product.name} masuk keranjang`, {
        description: `${safeQty} butir (${size}, ${BUTIR_PREPARATION_LABEL[preparation]})`,
        action: { label: "Lihat Keranjang", onClick: () => openCart() },
      });
    } else {
      addLine({
        mode: "gram",
        productId: product.id,
        slug: product.slug,
        name: product.name,
        imageUrl: product.image_url,
        unitPrice,
        grams: clampedGrams,
        packaging,
        maxQuantity,
        quantity: safeQty,
      });
      toast.success(`${product.name} masuk keranjang`, {
        description: `${safeQty}× ${formatGram(clampedGrams)} (${GRAM_PACKAGING_META[packaging].label})`,
        action: { label: "Lihat Keranjang", onClick: () => openCart() },
      });
    }

    onAdded?.();
  }

  const isCompact = variant === "compact";

  return (
    <div className={cn("space-y-3.5", !isCompact && "space-y-4")}>
      {/* Mode Switcher */}
      {canButir && canGram ? (
        <div
          role="group"
          aria-label="Pilih cara beli"
          className="relative grid grid-cols-2 rounded-full border border-orchard/12 bg-cream-2 p-1"
        >
          {(["butir", "gram"] as const).map((m) => {
            const selected = activeMode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => handleModeChange(m)}
                className={cn(
                  "relative z-10 flex items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-semibold transition-colors",
                  selected ? "text-cream" : "text-moss hover:text-orchard",
                )}
              >
                {selected ? (
                  <motion.span
                    layoutId={`mode-pill-${uid}`}
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    className="absolute inset-0 -z-10 rounded-full bg-orchard shadow-soft"
                  />
                ) : null}
                {m === "butir" ? <Package className="size-3.5" /> : <Scale className="size-3.5" />}
                <span>{m === "butir" ? "Per Butir" : "Per Gram"}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="inline-flex items-center gap-1.5 rounded-full border border-orchard/15 bg-cream-2 px-3 py-1 text-[11px] font-semibold text-orchard">
          {canButir ? <Package className="size-3.5 text-gold-hover" /> : <Scale className="size-3.5 text-gold-hover" />}
          <span>{canButir ? "Jual Per Butir (Utuh)" : "Khusus Per Gram-an (Kupas Siap Santap)"}</span>
        </div>
      )}

      {/* Mode Body */}
      {activeMode === "butir" ? (
        <div className="space-y-3 rounded-2xl border border-orchard/10 bg-cream/65 p-3">
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="font-semibold uppercase tracking-wider text-moss">Pilih Ukuran</span>
            <span
              className={cn(
                "font-mono font-semibold tabular",
                product.stock_butir === 0
                  ? "text-crimson"
                  : product.stock_butir <= LOW_STOCK_BUTIR
                    ? "text-crimson"
                    : "text-orchard",
              )}
            >
              {product.stock_butir > 0 ? `Tersedia ${product.stock_butir} butir` : "Stok butir habis"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {BUTIR_SIZES.map((opt) => {
              const selected = size === opt.id;
              const price = butirUnitPrice(product, opt.id);
              const weight = butirWeightKg(product, opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSize(opt.id)}
                  className={cn(
                    "rounded-xl border px-2 py-2 text-left transition",
                    selected
                      ? "border-gold bg-custard/65 ring-1 ring-gold"
                      : "border-orchard/10 bg-white/80 hover:border-orchard/30",
                  )}
                >
                  <span className="block text-[11.5px] font-bold text-bark">{opt.label}</span>
                  <span className="block font-mono text-[10.5px] text-moss tabular">
                    ±{weight.toLocaleString("id-ID")} kg
                  </span>
                  {!isCompact ? (
                    <span className="mt-1 block font-mono text-[11px] font-semibold text-orchard tabular">
                      {formatRupiah(price)}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-moss">Penyajian</span>
            <div className="grid grid-cols-2 gap-1.5">
              {(["utuh", "kupas"] as const).map((prep) => {
                const selected = preparation === prep;
                return (
                  <button
                    key={prep}
                    type="button"
                    onClick={() => setPreparation(prep)}
                    className={cn(
                      "flex items-center justify-center gap-1 rounded-xl border px-2.5 py-2 text-[11.5px] font-semibold transition",
                      selected
                        ? "border-orchard bg-orchard text-cream"
                        : "border-orchard/12 bg-white/80 text-bark hover:border-orchard/30",
                    )}
                  >
                    {selected ? <Check className="size-3 shrink-0 text-gold" /> : null}
                    <span className="truncate">
                      {isCompact && prep === "kupas" ? "Dibukakan / Kupas" : BUTIR_PREPARATION_LABEL[prep]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3 rounded-2xl border border-orchard/10 bg-cream/65 p-3">
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="font-semibold uppercase tracking-wider text-moss">Berat Daging</span>
            <span
              className={cn(
                "font-mono font-semibold tabular",
                product.stock_gram < product.min_gram || product.stock_gram <= LOW_STOCK_GRAM
                  ? "text-crimson"
                  : "text-orchard",
              )}
            >
              {product.stock_gram >= product.min_gram
                ? `Tersedia ${formatNumber(product.stock_gram)}g`
                : "Stok gram habis"}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {GRAM_PRESETS.map((preset) => {
              const disabled = preset < product.min_gram || preset > effectiveMaxGram || !gramInStock;
              const selected = clampedGrams === preset && !disabled;
              return (
                <button
                  key={preset}
                  type="button"
                  disabled={disabled}
                  onClick={() => setGrams(preset)}
                  className={cn(
                    "rounded-xl border py-1.5 font-mono text-[11.5px] font-semibold tabular transition",
                    selected
                      ? "border-gold bg-custard text-orchard ring-1 ring-gold"
                      : "border-orchard/10 bg-white/80 text-bark hover:border-orchard/30",
                    disabled && "cursor-not-allowed opacity-40 hover:border-orchard/10",
                  )}
                >
                  {preset >= 1000 ? "1 kg" : `${preset}g`}
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-moss">Atur gramasi</span>
              <span className="font-mono font-bold text-orchard tabular">{formatGram(clampedGrams)}</span>
            </div>
            {effectiveMaxGram > product.min_gram ? (
              <Slider
                min={product.min_gram}
                max={effectiveMaxGram}
                step={GRAM_STEP}
                value={[clampedGrams]}
                disabled={!gramInStock}
                onValueChange={(vals) => {
                  const v = vals[0];
                  if (v !== undefined) setGrams(v);
                }}
              />
            ) : (
              <p className="rounded-lg bg-cream-2 px-2.5 py-1.5 text-[11px] text-moss">
                Tersisa kemasan {formatGram(product.min_gram)}.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-moss">Kemasan</span>
            <div className="grid grid-cols-2 gap-1.5">
              {(["thinwall", "vacuum"] as const).map((pack) => {
                const selected = packaging === pack;
                const meta = GRAM_PACKAGING_META[pack];
                return (
                  <button
                    key={pack}
                    type="button"
                    onClick={() => setPackaging(pack)}
                    className={cn(
                      "rounded-xl border px-2.5 py-2 text-left transition",
                      selected
                        ? "border-orchard bg-orchard text-cream"
                        : "border-orchard/12 bg-white/80 text-bark hover:border-orchard/30",
                    )}
                  >
                    <span className="block truncate text-[11.5px] font-semibold">
                      {pack === "thinwall" ? "Thinwall Segar" : "Vacuum Pack"}
                    </span>
                    <span
                      className={cn(
                        "block font-mono text-[10px] tabular",
                        selected ? "text-custard" : "text-moss",
                      )}
                    >
                      {meta.surcharge === 0 ? "Gratis" : `+${formatRupiah(meta.surcharge)} · Luar kota`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Price & CTA */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          <span className="block text-[10.5px] font-medium text-moss">
            {activeMode === "butir"
              ? `1 butir ${size}`
              : `${formatGram(clampedGrams)} · ${formatRupiah(product.price_per_100g)}/100g`}
          </span>
          <RollingNumber
            value={unitPrice * safeQty}
            prefix="Rp"
            className={cn("font-bold text-orchard", isCompact ? "text-xl" : "text-2xl")}
          />
        </div>

        {!isCompact && isAvailable ? (
          <div className="flex items-center gap-1.5 rounded-full border border-orchard/15 bg-white px-2 py-1">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={safeQty <= 1}
              className="grid size-7 place-items-center rounded-full text-orchard transition hover:bg-cream-2 disabled:opacity-35"
              aria-label="Kurangi jumlah"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="w-6 text-center font-mono text-xs font-bold tabular text-bark">{safeQty}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
              disabled={safeQty >= maxQuantity}
              className="grid size-7 place-items-center rounded-full text-orchard transition hover:bg-cream-2 disabled:opacity-35"
              aria-label="Tambah jumlah"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        disabled={!isAvailable}
        onClick={handleAdd}
        className={cn(
          "flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition",
          "active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
          isAvailable
            ? "bg-gold text-orchard shadow-soft hover:bg-gold-hover hover:shadow-gold"
            : "bg-orchard/10 text-moss",
        )}
      >
        <ShoppingBag className="size-4" />
        <span>
          {isAvailable
            ? "Tambah ke Keranjang"
            : activeMode === "butir"
              ? "Stok Butir Habis"
              : "Stok Gram Habis"}
        </span>
      </button>
    </div>
  );
}
