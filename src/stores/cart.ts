"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { ButirPreparation, ButirSize, GramPackaging } from "@/types/database";

type CartBase = {
  key: string;
  productId: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  quantity: number;
  /** Display price only — the server re-prices everything at checkout. */
  unitPrice: number;
};

export type CartLine =
  | (CartBase & {
      mode: "butir";
      size: ButirSize;
      preparation: ButirPreparation;
      gradeId?: string | null;
      gradeName?: string | null;
      gradeMultiplier?: number;
      preparationId?: string | null;
      preparationName?: string | null;
      preparationPrice?: number;
      packingId?: string | null;
      packingName?: string | null;
      packingPrice?: number;
      maxQuantity: number;
    })
  | (CartBase & {
      mode: "gram";
      grams: number;
      packaging: GramPackaging;
      packingId?: string | null;
      packingName?: string | null;
      packingPrice?: number;
      maxQuantity: number;
    });

export type NewCartLine =
  | (Omit<Extract<CartLine, { mode: "butir" }>, "key" | "quantity"> & { quantity?: number })
  | (Omit<Extract<CartLine, { mode: "gram" }>, "key" | "quantity"> & { quantity?: number });

function lineKey(line: NewCartLine): string {
  return line.mode === "butir"
    ? `${line.productId}:butir:${line.gradeId ?? line.size}:${line.preparationId ?? line.preparation}:${line.packingId ?? "std"}`
    : `${line.productId}:gram:${line.grams}:${line.packingId ?? line.packaging}`;
}

function createCartLine(incoming: NewCartLine, key: string): CartLine {
  const quantity = Math.max(1, Math.min(incoming.maxQuantity, incoming.quantity ?? 1));
  if (incoming.mode === "butir") {
    return {
      key,
      mode: "butir",
      productId: incoming.productId,
      slug: incoming.slug,
      name: incoming.name,
      imageUrl: incoming.imageUrl,
      unitPrice: incoming.unitPrice,
      size: incoming.size,
      preparation: incoming.preparation,
      gradeId: incoming.gradeId ?? null,
      gradeName: incoming.gradeName ?? null,
      gradeMultiplier: incoming.gradeMultiplier ?? 1,
      preparationId: incoming.preparationId ?? null,
      preparationName: incoming.preparationName ?? null,
      preparationPrice: incoming.preparationPrice ?? 0,
      packingId: incoming.packingId ?? null,
      packingName: incoming.packingName ?? null,
      packingPrice: incoming.packingPrice ?? 0,
      maxQuantity: incoming.maxQuantity,
      quantity,
    };
  }
  return {
    key,
    mode: "gram",
    productId: incoming.productId,
    slug: incoming.slug,
    name: incoming.name,
    imageUrl: incoming.imageUrl,
    unitPrice: incoming.unitPrice,
    grams: incoming.grams,
    packaging: incoming.packaging,
    packingId: incoming.packingId ?? null,
    packingName: incoming.packingName ?? null,
    packingPrice: incoming.packingPrice ?? 0,
    maxQuantity: incoming.maxQuantity,
    quantity,
  };
}

type CartState = {
  lines: CartLine[];
  isOpen: boolean;
  bump: number;
  addLine: (line: NewCartLine) => void;
  setQuantity: (key: string, quantity: number) => void;
  removeLine: (key: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  setOpen: (open: boolean) => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      isOpen: false,
      bump: 0,
      addLine: (incoming) =>
        set((state) => {
          const key = lineKey(incoming);
          const qty = incoming.quantity ?? 1;
          const existing = state.lines.find((l) => l.key === key);
          const lines = existing
            ? state.lines.map((l) =>
                l.key === key
                  ? { ...l, quantity: Math.min(l.maxQuantity, l.quantity + qty), unitPrice: incoming.unitPrice }
                  : l,
              )
            : [...state.lines, createCartLine(incoming, key)];
          return { lines, bump: state.bump + 1 };
        }),
      setQuantity: (key, quantity) =>
        set((state) => ({
          lines: state.lines.map((l) =>
            l.key === key ? { ...l, quantity: Math.max(1, Math.min(l.maxQuantity, quantity)) } : l,
          ),
        })),
      removeLine: (key) => set((state) => ({ lines: state.lines.filter((l) => l.key !== key) })),
      clear: () => set({ lines: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      setOpen: (isOpen) => set({ isOpen }),
    }),
    {
      name: "agungdurian-cart-v1",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ lines: state.lines }),
      skipHydration: true,
    },
  ),
);

export const selectCartCount = (s: CartState) => s.lines.reduce((n, l) => n + l.quantity, 0);
export const selectCartTotal = (s: CartState) => s.lines.reduce((n, l) => n + l.unitPrice * l.quantity, 0);
