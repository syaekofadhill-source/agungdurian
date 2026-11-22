"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

/** Hand-drawn style durian leaf sprig — botanical ornament. */
export function LeafSprig({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" className={cn("text-orchard", className)} aria-hidden>
      <path d="M14 108C40 82 64 58 106 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      {[
        { x: 30, y: 90, r: -30 },
        { x: 46, y: 74, r: -36 },
        { x: 62, y: 57, r: -40 },
        { x: 78, y: 40, r: -44 },
      ].map((l, i) => (
        <g key={i} transform={`translate(${l.x} ${l.y}) rotate(${l.r})`}>
          <path d="M0 0C6-14 22-18 34-14C26-4 12 2 0 0Z" fill="currentColor" fillOpacity=".14" stroke="currentColor" strokeWidth="1.1" />
          <path d="M0 0C10-6 20-10 34-14" stroke="currentColor" strokeWidth=".8" strokeOpacity=".6" />
          <path d="M0 0C-4 14 4 28 16 34C18 22 12 8 0 0Z" fill="currentColor" fillOpacity=".08" stroke="currentColor" strokeWidth="1.1" />
        </g>
      ))}
    </svg>
  );
}

/** Stylised durian thorn pattern used as a section divider. */
export function ThornDivider({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 16" className={cn("text-gold", className)} aria-hidden>
      <path d="M0 8h96" stroke="currentColor" strokeOpacity=".5" />
      <path d="M144 8h96" stroke="currentColor" strokeOpacity=".5" />
      <path d="M104 8l6-6 6 6-6 6zM114 8l6-7 6 7-6 7zM124 8l6-6 6 6-6 6z" fill="currentColor" />
    </svg>
  );
}

/** Concentric topographic contour lines — evokes the Sigaluh hillside orchard. */
export function ContourLines({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 600" fill="none" className={className} aria-hidden>
      {Array.from({ length: 9 }, (_, i) => (
        <path
          key={i}
          d={`M${300 - 40 - i * 28} 300c0-${60 + i * 22} ${50 + i * 12}-${110 + i * 26} ${120 + i * 30}-${100 + i * 28}s${110 + i * 26} ${70 + i * 18} ${90 + i * 24} ${130 + i * 30}-${80 + i * 20} ${110 + i * 26}-${150 + i * 32} ${80 + i * 22}S${300 - 40 - i * 28} ${360 + i * 20} ${300 - 40 - i * 28} 300z`}
          stroke="currentColor"
          strokeOpacity={0.5 - i * 0.045}
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}

export function StarRow({ rating, className }: { rating: number; className?: string }) {
  const uid = useId().replace(/:/g, "");
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`Rating ${rating} dari 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, rating - (i - 1)));
        const gradId = `star-${uid}-${i}`;
        return (
          <svg key={i} viewBox="0 0 20 20" className="size-4" aria-hidden>
            <defs>
              <linearGradient id={gradId}>
                <stop offset={`${fill * 100}%`} stopColor="#E8A817" />
                <stop offset={`${fill * 100}%`} stopColor="currentColor" stopOpacity=".25" />
              </linearGradient>
            </defs>
            <path
              d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.8z"
              fill={`url(#${gradId})`}
            />
          </svg>
        );
      })}
    </span>
  );
}

export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-4", className)}
      aria-hidden
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}
