"use client";

import { motion } from "framer-motion";

/** Deterministic PRNG so server & client render identical particles (no hydration mismatch). */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(53481);
const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  left: rand() * 100,
  top: 10 + rand() * 85,
  size: 2 + rand() * 4.5,
  duration: 9 + rand() * 10,
  delay: rand() * -14,
  drift: (rand() - 0.5) * 60,
  rise: 60 + rand() * 120,
  opacity: 0.35 + rand() * 0.5,
}));

/** Floating golden pollen — ambient hero motion (transform + opacity only). */
export function PollenParticles({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden>
      {PARTICLES.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full bg-gold will-change-transform"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            boxShadow: `0 0 ${p.size * 3}px rgb(232 168 23 / 0.7)`,
          }}
          initial={{ opacity: 0, x: 0, y: 0 }}
          animate={{
            opacity: [0, p.opacity, p.opacity, 0],
            x: [0, p.drift * 0.4, p.drift],
            y: [0, -p.rise * 0.5, -p.rise],
          }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
