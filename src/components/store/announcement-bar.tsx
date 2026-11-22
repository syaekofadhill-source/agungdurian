import { ArrowUpRight } from "lucide-react";

import { HARVEST_STATUS_META } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import type { StoreSettings } from "@/types/database";

const toneDot: Record<"gold" | "crimson" | "emerald", string> = {
  emerald: "bg-[#5fd38d]",
  crimson: "bg-crimson",
  gold: "bg-gold",
};

export function LiveDot({ tone, className }: { tone: "gold" | "crimson" | "emerald"; className?: string }) {
  return (
    <span className={cn("relative inline-flex size-2", className)} aria-hidden>
      <span className={cn("absolute inset-0 rounded-full animate-pulse-ring", toneDot[tone])} />
      <span className={cn("relative inline-flex size-2 rounded-full", toneDot[tone])} />
    </span>
  );
}

/** CMS-driven top announcement bar (harvest status + promo message). */
export function AnnouncementBar({ settings }: { settings: StoreSettings }) {
  const meta = HARVEST_STATUS_META[settings.harvest_status];
  return (
    <div className="relative z-40 bg-orchard text-cream">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-4 py-2 text-[12.5px] sm:justify-between">
        <p className="flex min-w-0 items-center gap-2.5">
          <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-cream/10 px-2.5 py-0.5 font-semibold uppercase tracking-[0.12em] text-[10.5px]">
            <LiveDot tone={meta.tone} />
            {meta.label}
          </span>
          <span className="truncate text-cream/85">{settings.harvest_banner_text}</span>
        </p>
        <a
          href={buildWhatsAppUrl(settings.whatsapp_number, `Halo ${settings.store_name}, saya mau tanya stok durian hari ini.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden shrink-0 items-center gap-1 font-semibold text-gold transition hover:text-custard sm:inline-flex"
        >
          Tanya stok hari ini <ArrowUpRight className="size-3.5" />
        </a>
      </div>
    </div>
  );
}
