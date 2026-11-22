"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export type TasteProfile = {
  sweet: number;
  creamy: number;
  bitter: number;
  thickness: number;
};

const ROWS: Array<{ key: keyof TasteProfile; label: string }> = [
  { key: "sweet", label: "Manis" },
  { key: "creamy", label: "Legit / Creamy" },
  { key: "bitter", label: "Pahit Khas" },
  { key: "thickness", label: "Ketebalan Daging" },
];

/**
 * Scroll-triggered taste meters (1–5). Bars grow via `scaleX` from the left
 * edge (GPU transform) with a staggered spring once they enter the viewport.
 */
export function TasteMeter({
  profile,
  className,
  compact = false,
  tone = "light",
}: {
  profile: TasteProfile;
  className?: string;
  compact?: boolean;
  tone?: "light" | "dark";
}) {
  return (
    <dl className={cn("grid", compact ? "gap-2" : "gap-3.5", className)}>
      {ROWS.map((row, i) => {
        const value = Math.max(1, Math.min(5, profile[row.key]));
        return (
          <div key={row.key} className="grid grid-cols-[minmax(0,7.5rem)_1fr_auto] items-center gap-3">
            <dt className={cn("text-xs font-semibold", tone === "dark" ? "text-cream/75" : "text-moss")}>{row.label}</dt>
            <dd className={cn("relative h-2 overflow-hidden rounded-full", tone === "dark" ? "bg-cream/10" : "bg-orchard/[0.08]")}>
              <motion.span
                className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-gradient-to-r from-gold/70 via-gold to-[#f5c544] will-change-transform"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: value / 5 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ type: "spring", stiffness: 70, damping: 18, delay: 0.08 * i }}
              />
              {/* scale ticks */}
              <span className="pointer-events-none absolute inset-0 grid grid-cols-5" aria-hidden>
                {[0, 1, 2, 3, 4].map((t) => (
                  <span key={t} className={cn("border-r last:border-r-0", tone === "dark" ? "border-orchard/40" : "border-cream/80")} />
                ))}
              </span>
            </dd>
            <dd className={cn("w-6 text-right font-mono text-xs tabular", tone === "dark" ? "text-cream" : "text-bark")}>
              {value}/5
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
