import { BUTIR_SIZES, GRAM_PACKAGING_META } from "@/lib/constants";
import type { ButirSize, CustomOption, GramPackaging, Product, PromoVoucher } from "@/types/database";

/**
 * Single source of truth for pricing — used by the client configurator for
 * instant feedback AND by the checkout Server Action, which recomputes every
 * price from the database so the client can never dictate what it pays.
 */

export function getButirSize(size: ButirSize) {
  const found = BUTIR_SIZES.find((s) => s.id === size);
  if (found) return found;
  return { id: size, label: size, weightFactor: 1, priceMultiplier: 1 };
}

export function butirBasePrice(
  product: Pick<Product, "price_butir">,
  gradeOrSize: Pick<CustomOption, "price_multiplier"> | ButirSize,
): number {
  const mult =
    typeof gradeOrSize === "string"
      ? getButirSize(gradeOrSize).priceMultiplier
      : Number(gradeOrSize.price_multiplier || 1);
  return Math.round((product.price_butir * mult) / 1000) * 1000;
}

export function butirUnitPrice(
  product: Pick<Product, "price_butir">,
  size: ButirSize | Pick<CustomOption, "price_multiplier">,
  prepExtra = 0,
  packingExtra = 0,
): number {
  return butirBasePrice(product, size) + prepExtra + packingExtra;
}

export function butirWeightKg(product: Pick<Product, "avg_weight_kg">, size: ButirSize | number): number {
  const factor = typeof size === "number" ? size : getButirSize(size).weightFactor;
  return Math.round(product.avg_weight_kg * factor * 10) / 10;
}

export function gramBasePrice(product: Pick<Product, "price_per_100g">, grams: number): number {
  return Math.round((product.price_per_100g / 100) * grams);
}

export function gramUnitPrice(
  product: Pick<Product, "price_per_100g">,
  grams: number,
  packaging: GramPackaging | number,
): number {
  const surcharge = typeof packaging === "number" ? packaging : (GRAM_PACKAGING_META[packaging]?.surcharge ?? 0);
  return gramBasePrice(product, grams) + surcharge;
}

export function clampGrams(product: Pick<Product, "min_gram" | "max_gram" | "stock_gram">, grams: number): number {
  const upper = Math.max(product.min_gram, Math.min(product.max_gram, product.stock_gram));
  return Math.min(upper, Math.max(product.min_gram, grams));
}

/** Lowest price a shopper can pay for this product — used for "Mulai Rp…" labels and JSON-LD offers. */
export function startingPrice(product: Product): number {
  const candidates: number[] = [];
  if (product.allow_butir && product.price_butir > 0) candidates.push(butirBasePrice(product, "sedang"));
  if (product.allow_gram && product.price_per_100g > 0) candidates.push(gramBasePrice(product, product.min_gram));
  return candidates.length ? Math.min(...candidates) : 0;
}

export function isSoldOut(product: Product): boolean {
  const butirAvailable = product.allow_butir && product.stock_butir > 0;
  const gramAvailable = product.allow_gram && product.stock_gram >= product.min_gram;
  return !butirAvailable && !gramAvailable;
}

export function computeVoucherDiscount(
  voucher: Pick<PromoVoucher, "discount_type" | "discount_value" | "max_discount">,
  subtotal: number,
): number {
  if (subtotal <= 0) return 0;
  if (voucher.discount_type === "fixed") {
    return Math.min(subtotal, voucher.discount_value);
  }
  const raw = Math.round((subtotal * voucher.discount_value) / 100);
  const capped = voucher.max_discount ? Math.min(raw, voucher.max_discount) : raw;
  return Math.min(subtotal, capped);
}
