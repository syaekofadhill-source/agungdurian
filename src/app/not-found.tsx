import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-cream px-4 text-center text-bark">
      <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-gold-hover">404 · Tidak Ditemukan</p>
      <h1 className="mt-3 font-display text-4xl font-bold text-orchard sm:text-5xl">
        Halaman kebun ini tidak tersedia.
      </h1>
      <p className="mt-3 max-w-md text-sm text-moss">
        Varietas mungkin sedang diarsipkan atau tautan yang Anda buka keliru. Kembali ke beranda untuk melihat panen
        hari ini.
      </p>
      <div className="mt-7 flex gap-3">
        <Link href="/" className={buttonVariants({ variant: "gold", size: "lg" })}>
          Kembali ke Beranda
        </Link>
        <Link href="/#katalog" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Lihat Katalog
        </Link>
      </div>
    </div>
  );
}
