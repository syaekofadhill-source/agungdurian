"use client";

import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";

import { RollingNumber } from "@/components/motion/rolling-number";
import { ProductImage } from "@/components/store/product-image";
import { Dialog, DialogClose, DialogDescription, DialogTitle, SheetContent } from "@/components/ui/dialog";
import { BUTIR_PREPARATION_LABEL, GRAM_PACKAGING_META } from "@/lib/constants";
import { getButirSize } from "@/lib/pricing";
import { formatGram, formatRupiah } from "@/lib/utils";
import { selectCartCount, selectCartTotal, useCartStore } from "@/stores/cart";
import type { StoreSettings } from "@/types/database";

export function CartDrawer({ settings }: { settings: StoreSettings }) {
  const lines = useCartStore((s) => s.lines);
  const isOpen = useCartStore((s) => s.isOpen);
  const setOpen = useCartStore((s) => s.setOpen);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeLine = useCartStore((s) => s.removeLine);
  const count = useCartStore(selectCartCount);
  const total = useCartStore(selectCartTotal);

  return (
    <>
      {count > 0 && !isOpen ? (
        <div className="fixed inset-x-4 bottom-4 z-30 md:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-13 w-full items-center justify-between rounded-full bg-orchard px-5 text-cream shadow-lift ring-1 ring-gold/40"
          >
            <span className="flex items-center gap-2.5 text-sm font-semibold">
              <ShoppingBag className="size-4 text-gold" />
              <span>{count} item dipilih</span>
            </span>
            <span className="flex items-center gap-2 font-mono text-sm font-bold text-gold tabular">
              {formatRupiah(total)}
              <span className="rounded-full bg-gold px-2.5 py-0.5 font-sans text-xs text-orchard">Buka</span>
            </span>
          </button>
        </div>
      ) : null}

      <Dialog open={isOpen} onOpenChange={setOpen}>
        <SheetContent className="p-0">
          <div className="flex items-center justify-between border-b border-orchard/10 px-6 py-4">
            <div>
              <DialogTitle className="font-display text-xl font-bold text-orchard">Keranjang Belanja</DialogTitle>
              <DialogDescription className="text-xs text-moss">
                {count} item · {settings.store_name}
              </DialogDescription>
            </div>
            <DialogClose className="rounded-full px-3 py-1.5 text-xs font-semibold text-moss transition hover:bg-cream-2">
              Tutup
            </DialogClose>
          </div>

          {lines.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <span className="grid size-16 place-items-center rounded-3xl bg-cream-2 text-orchard">
                <ShoppingBag className="size-7" />
              </span>
              <p className="mt-4 font-display text-xl font-semibold text-orchard">Keranjang masih kosong</p>
              <p className="mt-1.5 max-w-xs text-sm text-moss">
                Pilih durian matang pohon per butir atau daging kupas per gram di katalog kebun kami.
              </p>
              <Link
                href="/#katalog"
                onClick={() => setOpen(false)}
                className="mt-6 inline-flex h-11 items-center rounded-full bg-gold px-6 text-sm font-semibold text-orchard shadow-soft transition hover:bg-gold-hover"
              >
                Lihat Katalog Panen
              </Link>
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto px-6 py-5">
                {lines.map((line) => (
                  <div
                    key={line.key}
                    className="flex gap-3.5 rounded-2xl border border-orchard/10 bg-white/80 p-3.5 shadow-soft"
                  >
                    <div className="relative size-18 shrink-0 overflow-hidden rounded-xl bg-orchard">
                      <ProductImage src={line.imageUrl} alt={line.name} fill sizes="72px" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-display text-sm font-bold text-orchard">{line.name}</p>
                          <p className="mt-0.5 text-xs text-moss">
                            {line.mode === "butir"
                              ? `Per Butir · ${line.gradeName ?? getButirSize(line.size).label} · ${line.preparationName ?? BUTIR_PREPARATION_LABEL[line.preparation] ?? line.preparation}${line.packingName ? ` · ${line.packingName}` : ""}`
                              : `Per Gram · ${formatGram(line.grams)} · ${line.packingName ?? GRAM_PACKAGING_META[line.packaging]?.label ?? line.packaging}`}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLine(line.key)}
                          className="grid size-7 shrink-0 place-items-center rounded-full text-moss transition hover:bg-crimson/10 hover:text-crimson"
                          aria-label={`Hapus ${line.name}`}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        <div className="inline-flex items-center gap-1 rounded-full border border-orchard/12 bg-cream px-1.5 py-0.5">
                          <button
                            type="button"
                            onClick={() => setQuantity(line.key, line.quantity - 1)}
                            disabled={line.quantity <= 1}
                            className="grid size-6 place-items-center rounded-full text-orchard hover:bg-cream-2 disabled:opacity-35"
                            aria-label="Kurangi jumlah"
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="w-5 text-center font-mono text-xs font-bold tabular text-bark">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQuantity(line.key, line.quantity + 1)}
                            disabled={line.quantity >= line.maxQuantity}
                            className="grid size-6 place-items-center rounded-full text-orchard hover:bg-cream-2 disabled:opacity-35"
                            aria-label="Tambah jumlah"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                        <span className="font-mono text-sm font-bold text-orchard tabular">
                          {formatRupiah(line.unitPrice * line.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t border-orchard/10 bg-cream-2/60 p-6">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-moss">Subtotal Estimasi</span>
                  <RollingNumber value={total} prefix="Rp" className="text-2xl font-bold text-orchard" />
                </div>
                <p className="text-[11.5px] text-moss">
                  Pilih pembayaran DANA (upload bukti), COD, atau Bayar di Kebun pada halaman checkout.
                </p>
                <Link
                  href="/checkout"
                  onClick={() => setOpen(false)}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gold text-sm font-bold text-orchard shadow-soft transition hover:bg-gold-hover"
                >
                  <span>Lanjut ke Checkout</span>
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </>
          )}
        </SheetContent>
      </Dialog>
    </>
  );
}
