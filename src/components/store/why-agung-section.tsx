import { Scale, ShieldCheck, Sprout, Truck } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import { LeafSprig, ThornDivider } from "@/components/store/ornaments";

export function WhyAgungSection() {
  return (
    <section id="keunggulan" className="relative overflow-hidden bg-cream-2/70 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-hover">
            Standar Kebun Pak Agung
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-orchard sm:text-4xl">
            Kenapa penikmat durian jauh-jauh datang ke Sigaluh?
          </h2>
          <ThornDivider className="mx-auto mt-5 h-4 w-56" />
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-12">
          <Reveal className="relative overflow-hidden rounded-3xl bg-orchard p-7 text-cream shadow-lift md:col-span-7 sm:p-9">
            <LeafSprig className="pointer-events-none -bottom-10 -right-10 absolute size-64 text-cream opacity-10" />
            <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-gold text-orchard shadow-soft">
              <ShieldCheck className="size-6" />
            </span>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              Komitmen Utama
            </p>
            <h3 className="mt-1.5 font-display text-2xl font-semibold text-cream sm:text-3xl">
              Garansi ganti baru jika hambar atau mengkal.
            </h3>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-cream/80 sm:text-base">
              Makan langsung di kebun atau kirim ke rumah — bila ada buah yang kurang matang, berair, atau hambar,
              langsung kami tukar dengan buah baru atau refund sesuai kesepakatan. Tanpa drama.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-cream/10 px-3 py-1 text-custard">Boleh buka &amp; cicip di tempat</span>
              <span className="rounded-full bg-cream/10 px-3 py-1 text-custard">Klaim kirim cukup video unboxing</span>
            </div>
          </Reveal>

          <Reveal
            delay={0.08}
            className="flex flex-col justify-between rounded-3xl border border-gold/30 bg-custard/60 p-7 shadow-soft md:col-span-5 sm:p-8"
          >
            <div>
              <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-orchard text-gold">
                <Sprout className="size-5" />
              </span>
              <h3 className="mt-5 font-display text-2xl font-semibold text-orchard">
                Matang pohon, bukan peraman.
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-bark/80">
                Buah diikat tali pengaman di dahan lereng Sigaluh dan baru dipungut setelah terlepas alami. Rasa legit dan
                aromanya jauh lebih dalam dibanding durian tebasan muda.
              </p>
            </div>
            <p className="mt-6 border-t border-orchard/10 pt-4 font-mono text-xs font-semibold text-orchard">
              Panen harian · Ketinggian ±480 mdpl
            </p>
          </Reveal>

          <Reveal
            delay={0.12}
            className="flex flex-col justify-between rounded-3xl border border-orchard/10 bg-white/80 p-7 shadow-soft md:col-span-5 sm:p-8"
          >
            <div>
              <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-cream-2 text-orchard">
                <Scale className="size-5" />
              </span>
              <h3 className="mt-5 font-display text-2xl font-semibold text-orchard">
                Timbangan digital jujur.
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-moss">
                Baik beli per butir utuh maupun daging kupas per gram, semuanya ditimbang terbuka dengan timbangan
                digital terkalibrasi. Berat bersih daging tanpa tambahan cangkang.
              </p>
            </div>
            <p className="mt-6 border-t border-orchard/10 pt-4 font-mono text-xs text-moss">
              Presisi hingga kelipatan 50g
            </p>
          </Reveal>

          <Reveal
            delay={0.16}
            className="flex flex-col justify-between rounded-3xl border border-orchard/10 bg-white/80 p-7 shadow-soft md:col-span-7 sm:p-8"
          >
            <div>
              <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-orchard/10 text-orchard">
                <Truck className="size-5" />
              </span>
              <h3 className="mt-5 font-display text-2xl font-semibold text-orchard">
                Santap di saung, COD Banjarnegara, atau kirim Vacuum.
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-moss">
                Datang bersama keluarga ke kebun Karangmangu untuk makan di tempat, pesan antar area Banjarnegara &amp;
                sekitarnya, atau kirim ke kota besar dengan kemasan Vacuum Pack + ice gel yang menjaga kesegaran.
              </p>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2 border-t border-orchard/10 pt-4 text-center text-xs font-semibold text-orchard">
              <span className="rounded-xl bg-cream-2 py-2">Ambil di Kebun</span>
              <span className="rounded-xl bg-cream-2 py-2">Kurir Lokal</span>
              <span className="rounded-xl bg-cream-2 py-2">Vacuum Luar Kota</span>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
