"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, MessageCircle, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Dialog, DialogClose, DialogDescription, DialogTitle, SheetContent } from "@/components/ui/dialog";
import { cn, prettyPhone } from "@/lib/utils";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { selectCartCount, useCartStore } from "@/stores/cart";
import type { StoreSettings } from "@/types/database";

const NAV_LINKS = [
  { href: "/#katalog", label: "Katalog" },
  { href: "/#keunggulan", label: "Garansi" },
  { href: "/#rekomendasi", label: "Cari Rasa" },
  { href: "/#testimoni", label: "Testimoni" },
  { href: "/#lokasi", label: "Lokasi" },
] as const;

export function StoreHeader({ settings }: { settings: StoreSettings }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const count = useCartStore(selectCartCount);
  const bump = useCartStore((s) => s.bump);
  const openCart = useCartStore((s) => s.open);

  useEffect(() => {
    void useCartStore.persist.rehydrate();
  }, []);

  const waUrl = buildWhatsAppUrl(
    settings.whatsapp_number,
    `Halo ${settings.store_name}, saya ingin konsultasi atau memesan durian hari ini.`,
  );

  return (
    <header className="sticky top-0 z-40 border-b border-orchard/10 bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:h-18 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5 outline-none">
          <span className="grid size-10 place-items-center rounded-2xl bg-orchard text-gold shadow-soft transition-transform duration-300 group-hover:scale-105">
            <svg viewBox="0 0 36 36" className="size-6" aria-hidden>
              <path
                d="M18 4c1.2 2.4 3.4 3 5.2 2.4-.5 2.4.7 4.2 3 5.3-1.7 1.2-2.2 3.4-1.2 5.2 2.4 0 4.2 1.8 4.2 3.6-2.4 0-3.6 1.8-3.6 4.2 0 5-3.4 9-7.6 9s-7.6-4-7.6-9c0-2.4-1.2-4.2-3.6-4.2 0-1.8 1.8-3.6 4.2-3.6 1-1.8.5-4-1.2-5.2 2.3-1.1 3.5-2.9 3-5.3 1.8.6 4 0 5.2-2.4z"
                fill="currentColor"
              />
              <path d="M18 13v16M18 13c-3.5 3.6-4.5 8-3.4 13.5M18 13c3.5 3.6 4.5 8 3.4 13.5" stroke="#0D2419" strokeWidth="1.3" strokeLinecap="round" fill="none" />
            </svg>
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg font-bold tracking-tight text-orchard sm:text-xl">
              {settings.store_name}
            </span>
            <span className="hidden text-[11px] font-medium tracking-wide text-moss sm:block">
              Karangmangu · Sigaluh
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Navigasi utama">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-bark/80 transition-colors hover:text-orchard"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden h-10 items-center gap-2 rounded-full border border-orchard/15 bg-white/60 px-4 text-xs font-semibold text-orchard transition hover:border-orchard/35 hover:bg-white sm:inline-flex"
          >
            <MessageCircle className="size-4 text-orchard" />
            <span>WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={openCart}
            className={cn(
              "relative inline-flex h-10 items-center gap-2 rounded-full bg-orchard px-4 text-sm font-semibold text-cream shadow-soft transition",
              "hover:bg-orchard-2 active:scale-[0.97]",
            )}
            aria-label={`Buka keranjang (${count} item)`}
          >
            <ShoppingBag className="size-4 text-gold" />
            <span className="hidden sm:inline">Keranjang</span>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={`${count}-${bump}`}
                initial={{ scale: 0.65, opacity: 0.7 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 18 }}
                className={cn(
                  "grid min-w-5 place-items-center rounded-full px-1.5 py-0.5 font-mono text-[11px] font-bold tabular",
                  count > 0 ? "bg-gold text-orchard" : "bg-cream/15 text-cream/85",
                )}
              >
                {count}
              </motion.span>
            </AnimatePresence>
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="grid size-10 place-items-center rounded-full border border-orchard/15 bg-white/60 text-orchard transition hover:bg-white lg:hidden"
            aria-label="Buka menu navigasi"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </div>

      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent className="max-w-xs justify-between p-6">
          <div>
            <div className="flex items-center justify-between border-b border-orchard/10 pb-4">
              <div>
                <DialogTitle className="font-display text-xl font-bold text-orchard">{settings.store_name}</DialogTitle>
                <DialogDescription className="text-xs text-moss">{settings.opening_hours}</DialogDescription>
              </div>
              <DialogClose className="rounded-full px-3 py-1.5 text-xs font-semibold text-moss hover:bg-orchard/5">
                Tutup
              </DialogClose>
            </div>
            <nav className="mt-6 flex flex-col gap-1" aria-label="Menu seluler">
              {NAV_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-2xl px-3.5 py-3 font-display text-lg font-medium text-bark transition hover:bg-cream-2"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-3 border-t border-orchard/10 pt-5 text-xs text-moss">
            <p className="leading-relaxed">{settings.address}</p>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gold font-semibold text-orchard shadow-soft transition hover:bg-gold-hover"
            >
              <MessageCircle className="size-4" />
              Chat {prettyPhone(settings.whatsapp_number)}
            </a>
          </div>
        </SheetContent>
      </Dialog>
    </header>
  );
}
