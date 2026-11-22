import { ArrowUpRight, Clock, MapPin, MessageCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { InstagramIcon, LeafSprig, StarRow } from "@/components/store/ornaments";
import { prettyPhone } from "@/lib/utils";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import type { StoreSettings } from "@/types/database";

export function StoreFooter({ settings }: { settings: StoreSettings }) {
  const year = new Date().getFullYear();
  const waUrl = buildWhatsAppUrl(
    settings.whatsapp_number,
    `Halo ${settings.store_name}, saya ingin bertanya tentang durian Sigaluh.`,
  );

  return (
    <footer className="relative overflow-hidden bg-orchard text-cream">
      <LeafSprig className="pointer-events-none -right-10 -top-10 absolute size-72 text-cream opacity-[0.07]" />

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-gold/15 text-gold ring-1 ring-gold/30">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <p className="font-display text-2xl font-bold tracking-tight text-cream">{settings.store_name}</p>
                <p className="text-xs text-cream/65">{settings.tagline}</p>
              </div>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-cream/75">
              Kebun durian keluarga di lereng Sigaluh. Hanya menjual buah jatuhan matang pohon dengan garansi ganti baru
              bila hambar atau mentah.
            </p>
            <div className="inline-flex items-center gap-2.5 rounded-full bg-cream/10 px-3.5 py-1.5 text-xs">
              <StarRow rating={settings.google_rating} className="text-cream" />
              <span className="font-mono font-semibold tabular text-custard">{settings.google_rating}/5</span>
              <span className="text-cream/70">({settings.google_review_count} ulasan Google)</span>
            </div>
          </div>

          <div className="space-y-3 lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">Jelajah</p>
            <ul className="space-y-2.5 text-sm text-cream/80">
              <li>
                <Link href="/#katalog" className="transition hover:text-gold">
                  Katalog Panen
                </Link>
              </li>
              <li>
                <Link href="/#keunggulan" className="transition hover:text-gold">
                  Garansi Matang Pohon
                </Link>
              </li>
              <li>
                <Link href="/#rekomendasi" className="transition hover:text-gold">
                  Panduan Pilih Rasa
                </Link>
              </li>
              <li>
                <Link href="/#testimoni" className="transition hover:text-gold">
                  Kata Pembeli
                </Link>
              </li>
              <li>
                <Link href="/#lokasi" className="transition hover:text-gold">
                  Kunjungi Kebun
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3 lg:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">Kebun &amp; Jam Buka</p>
            <div className="space-y-2.5 text-sm text-cream/80">
              <p className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-gold" />
                <span>{settings.address}</span>
              </p>
              <p className="flex items-center gap-2.5">
                <Clock className="size-4 shrink-0 text-gold" />
                <span>{settings.opening_hours}</span>
              </p>
              <a
                href={settings.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-custard transition hover:text-gold"
              >
                Buka di Google Maps <ArrowUpRight className="size-3.5" />
              </a>
            </div>
          </div>

          <div className="space-y-3 lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">Hubungi Kami</p>
            <div className="space-y-2.5 text-sm text-cream/80">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 transition hover:text-gold"
              >
                <MessageCircle className="size-4 shrink-0 text-gold" />
                <span className="font-mono text-xs tabular">{prettyPhone(settings.whatsapp_number)}</span>
              </a>
              {settings.instagram_handle ? (
                <a
                  href={`https://instagram.com/${settings.instagram_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 transition hover:text-gold"
                >
                  <InstagramIcon className="size-4 shrink-0 text-gold" />
                  <span>@{settings.instagram_handle}</span>
                </a>
              ) : null}
              <div className="pt-2">
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1 text-xs text-cream/45 transition hover:text-cream/80"
                >
                  Panel Pengelola
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-cream/10 pt-6 text-xs text-cream/55 sm:flex-row sm:items-center">
          <p>
            © {year} {settings.store_name} (Durian Pak Agung). Karangmangu, Sigaluh, Banjarnegara.
          </p>
          <p>Dipanen segar dengan timbangan digital jujur.</p>
        </div>
      </div>
    </footer>
  );
}
