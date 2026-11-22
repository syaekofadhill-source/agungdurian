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
  | (CartBase & { mode: "butir"; size: ButirSize; preparation: ButirPreparation; maxQuantity: number })
  | (CartBase & { mode: "gram"; grams: number; packaging: GramPackaging; maxQuantity: number });

export type NewCartLine =
  | (Omit<Extract<CartLine, { mode: "butir" }>, "key" | "quantity"> & { quantity?: number })
  | (Omit<Extract<CartLine, { mode: "gram" }>, "key" | "quantity"> & { quantity?: number });

function lineKey(line: NewCartLine): string {
  return line.mode === "butir"
    ? `${line.productId}:butir:${line.size}:${line.preparation}`
    : `${line.productId}:gram:${line.grams}:${line.packaging}`;
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
    maxQuantity: incoming.maxQuantity,
    quantity,
  };
}

type CartState = {
  lines: CartLine[];
  isOpen: boolean;
  /** Increments on every add — drives the header badge bounce animation. */
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
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ lines: state.lines }),
      skipHydration: true,
    },
  ),
);

export const selectCartCount = (s: CartState) => s.lines.reduce((n, l) => n + l.quantity, 0);
export const selectCartTotal = (s: CartState) => s.lines.reduce((n, l) => n + l.unitPrice * l.quantity, 0);
