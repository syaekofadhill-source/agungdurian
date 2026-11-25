import { Scale, ShieldCheck, Sprout, Truck } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import { LeafSprig, ThornDivider } from "@/components/store/ornaments";
import { ProductImage } from "@/components/store/product-image";
import { DEFAULT_WHY_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { StoreSettings, WhyIconName } from "@/types/database";

const ICONS: Record<WhyIconName, React.ComponentType<{ className?: string }>> = {
  shield: ShieldCheck,
  sprout: Sprout,
  scale: Scale,
  truck: Truck,
};

export function WhyAgungSection({ settings }: { settings: StoreSettings }) {
  const items = settings.why_items_json?.length === 4 ? settings.why_items_json : DEFAULT_WHY_ITEMS;
  const first = items[0] ?? DEFAULT_WHY_ITEMS[0]!;
  const second = items[1] ?? DEFAULT_WHY_ITEMS[1]!;
  const third = items[2] ?? DEFAULT_WHY_ITEMS[2]!;
  const fourth = items[3] ?? DEFAULT_WHY_ITEMS[3]!;

  const FirstIcon = ICONS[first.icon] ?? ShieldCheck;
  const SecondIcon = ICONS[second.icon] ?? Sprout;
  const ThirdIcon = ICONS[third.icon] ?? Scale;
  const FourthIcon = ICONS[fourth.icon] ?? Truck;

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

        {settings.story_image_url ? (
          <Reveal className="mt-10 overflow-hidden rounded-3xl border border-orchard/10 bg-orchard shadow-soft">
            <div className="relative aspect-[21/7] min-h-48 w-full">
              <ProductImage
                src={settings.story_image_url}
                alt={`Suasana panen kebun ${settings.store_name}`}
                fill
                sizes="(max-width: 1280px) 96vw, 1200px"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-orchard/65 via-transparent to-transparent" />
              <p className="absolute bottom-4 left-6 rounded-full bg-orchard/85 px-4 py-1.5 text-xs font-semibold text-custard backdrop-blur">
                Kebun &amp; Panen Pagi · {settings.store_name}
              </p>
            </div>
          </Reveal>
        ) : null}

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-12">
          <Reveal className="relative overflow-hidden rounded-3xl bg-orchard p-7 text-cream shadow-lift md:col-span-7 sm:p-9">
            <LeafSprig className="pointer-events-none -bottom-10 -right-10 absolute size-64 text-cream opacity-10" />
            <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-gold text-orchard shadow-soft">
              <FirstIcon className="size-6" />
            </span>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-gold">{first.badge}</p>
            <h3 className="mt-1.5 font-display text-2xl font-semibold text-cream sm:text-3xl">{first.title}</h3>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-cream/80 sm:text-base">{first.description}</p>
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
                <SecondIcon className="size-5" />
              </span>
              <h3 className="mt-5 font-display text-2xl font-semibold text-orchard">{second.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-bark/80">{second.description}</p>
            </div>
            <p className="mt-6 border-t border-orchard/10 pt-4 font-mono text-xs font-semibold text-orchard">
              {second.badge}
            </p>
          </Reveal>

          <Reveal
            delay={0.12}
            className="flex flex-col justify-between rounded-3xl border border-orchard/10 bg-white/80 p-7 shadow-soft md:col-span-5 sm:p-8"
          >
            <div>
              <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-cream-2 text-orchard">
                <ThirdIcon className="size-5" />
              </span>
              <h3 className="mt-5 font-display text-2xl font-semibold text-orchard">{third.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-moss">{third.description}</p>
            </div>
            <p className="mt-6 border-t border-orchard/10 pt-4 font-mono text-xs text-moss">{third.badge}</p>
          </Reveal>

          <Reveal
            delay={0.16}
            className="flex flex-col justify-between rounded-3xl border border-orchard/10 bg-white/80 p-7 shadow-soft md:col-span-7 sm:p-8"
          >
            <div>
              <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-orchard/10 text-orchard">
                <FourthIcon className="size-5" />
              </span>
              <h3 className="mt-5 font-display text-2xl font-semibold text-orchard">{fourth.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-moss">{fourth.description}</p>
            </div>
            <div className={cn("mt-6 flex items-center justify-between border-t border-orchard/10 pt-4 text-xs font-semibold text-orchard")}>
              <span>{fourth.badge}</span>
              <span className="rounded-full bg-cream-2 px-3 py-1 font-mono">DANA · COD · Kebun</span>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
