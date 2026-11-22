import { BUTIR_SIZES, GRAM_PACKAGING_META } from "@/lib/constants";
import type { ButirSize, GramPackaging, Product } from "@/types/database";

/**
 * Single source of truth for pricing — used by the client configurator for
 * instant feedback AND by the checkout Server Action, which recomputes every
 * price from the database so the client can never dictate what it pays.
 */

export function getButirSize(size: ButirSize) {
  const found = BUTIR_SIZES.find((s) => s.id === size);
  if (!found) throw new Error(`Ukuran tidak dikenal: ${size}`);
  return found;
}

export function butirUnitPrice(product: Pick<Product, "price_butir">, size: ButirSize): number {
  const { priceMultiplier } = getButirSize(size);
  // round to the nearest Rp 1.000 for clean price tags
  return Math.round((product.price_butir * priceMultiplier) / 1000) * 1000;
}

export function butirWeightKg(product: Pick<Product, "avg_weight_kg">, size: ButirSize): number {
  return Math.round(product.avg_weight_kg * getButirSize(size).weightFactor * 10) / 10;
}

export function gramBasePrice(product: Pick<Product, "price_per_100g">, grams: number): number {
  return Math.round((product.price_per_100g / 100) * grams);
}

export function gramUnitPrice(
  product: Pick<Product, "price_per_100g">,
  grams: number,
  packaging: GramPackaging,
): number {
  return gramBasePrice(product, grams) + GRAM_PACKAGING_META[packaging].surcharge;
}

export function clampGrams(product: Pick<Product, "min_gram" | "max_gram" | "stock_gram">, grams: number): number {
  const upper = Math.max(product.min_gram, Math.min(product.max_gram, product.stock_gram));
  return Math.min(upper, Math.max(product.min_gram, grams));
}

/** Lowest price a shopper can pay for this product — used for "Mulai Rp…" labels and JSON-LD offers. */
export function startingPrice(product: Product): number {
  const candidates: number[] = [];
  if (product.allow_butir && product.price_butir > 0) candidates.push(butirUnitPrice(product, "sedang"));
  if (product.allow_gram && product.price_per_100g > 0) candidates.push(gramBasePrice(product, product.min_gram));
  return candidates.length ? Math.min(...candidates) : 0;
}

export function isSoldOut(product: Product): boolean {
  const butirAvailable = product.allow_butir && product.stock_butir > 0;
  const gramAvailable = product.allow_gram && product.stock_gram >= product.min_gram;
  return !butirAvailable && !gramAvailable;
}
