"use client";

import { motion } from "framer-motion";

import { cn, formatNumber } from "@/lib/utils";

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

function Digit({ value }: { value: number }) {
  return (
    <span className="relative inline-block h-[1.15em] w-[1ch] overflow-hidden" aria-hidden>
      <motion.span
        className="absolute inset-x-0 top-0 flex flex-col will-change-transform"
        initial={false}
        animate={{ y: `${-value * 10}%` }}
        transition={{ type: "spring", stiffness: 190, damping: 24, mass: 0.7 }}
      >
        {DIGITS.map((n) => (
          <span key={n} className="block h-[1.15em] text-center leading-[1.15em]">
            {n}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

/**
 * Odometer-style rolling number. Each digit is a vertical 0–9 strip translated on
 * the Y axis (transform only). Keys are assigned from the right so adding a
 * thousands place doesn't re-mount the existing digits. JetBrains Mono +
 * tabular-nums guarantee zero horizontal jitter.
 */
export function RollingNumber({
  value,
  prefix,
  suffix,
  format = formatNumber,
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  format?: (n: number) => string;
  className?: string;
}) {
  const text = format(value);
  const chars = text.split("");
  const label = `${prefix ? `${prefix} ` : ""}${text}${suffix ?? ""}`;

  return (
    <span className={cn("inline-flex items-baseline font-mono tabular leading-none", className)}>
      <span className="sr-only">{label}</span>
      {prefix ? (
        <span aria-hidden className="mr-[0.3em]">
          {prefix}
        </span>
      ) : null}
      <span aria-hidden className="inline-flex">
        {chars.map((c, i) => {
          const fromRight = chars.length - i;
          return /\d/.test(c) ? (
            <Digit key={`d-${fromRight}`} value={Number(c)} />
          ) : (
            <span key={`s-${fromRight}`} className="inline-block h-[1.15em] leading-[1.15em]">
              {c}
            </span>
          );
        })}
      </span>
      {suffix ? (
        <span aria-hidden className="ml-[0.1em]">
          {suffix}
        </span>
      ) : null}
    </span>
  );
}
