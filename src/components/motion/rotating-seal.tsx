"use client";

import { motion } from "framer-motion";
import { useId } from "react";

import { cn } from "@/lib/utils";

/**
 * Rotating botanical authenticity seal — continuous slow 360° SVG loop.
 * Text is laid out on a circular <textPath>; only `transform: rotate` animates (GPU).
 */
export function RotatingSeal({
  text = "• 100% MATANG POHON • SIGALUH BANJARNEGARA • GARANSI MANIS ",
  className,
  size = 148,
}: {
  text?: string;
  className?: string;
  size?: number;
}) {
  const id = useId().replace(/:/g, "");

  return (
    <div className={cn("relative grid place-items-center", className)} style={{ width: size, height: size }}>
      <motion.svg
        viewBox="0 0 200 200"
        className="absolute inset-0 size-full will-change-transform"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 26, ease: "linear", repeat: Infinity }}
        aria-hidden
      >
        <defs>
          <path id={`seal-${id}`} d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
        </defs>
        <circle cx="100" cy="100" r="97" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1" />
        <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1" strokeDasharray="2 5" />
        <text className="fill-current font-mono text-[13.2px] font-medium tracking-[0.22em]">
          <textPath href={`#seal-${id}`} startOffset="0">
            {text}
            {text}
          </textPath>
        </text>
      </motion.svg>
      {/* Static durian emblem */}
      <svg viewBox="0 0 64 64" className="relative size-[38%]" aria-hidden>
        <path
          d="M32 6c2 4 6 5 9 4-1 4 1 7 5 9-3 2-4 6-2 9 4 0 7 3 7 6-4 0-6 3-6 7 0 9-6 16-13 16s-13-7-13-16c0-4-2-7-6-7 0-3 3-6 7-6 2-3 1-7-2-9 4-2 6-5 5-9 3 1 7 0 9-4z"
          fill="#E8A817"
        />
        <path d="M32 22c-6 6-8 14-6 24M32 22c6 6 8 14 6 24M32 22v28" stroke="#0D2419" strokeWidth="2" strokeLinecap="round" fill="none" opacity=".55" />
        <path d="M32 6c-1-3 0-5 2-6" stroke="#143324" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
}
