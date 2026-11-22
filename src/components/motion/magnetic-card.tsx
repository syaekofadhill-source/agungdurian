"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";

import { cn } from "@/lib/utils";

/**
 * Magnetic hover elevation: the card subtly follows the pointer, tilts in 3D and
 * lifts. Springs keep it buttery; all values are transforms (no layout thrash).
 */
export function MagneticCard({
  children,
  className,
  strength = 10,
}: {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const hover = useMotionValue(0);

  const spring = { stiffness: 220, damping: 22, mass: 0.6 };
  const x = useSpring(useTransform(mx, (v) => v * strength), spring);
  const y = useSpring(useTransform([my, hover], ([v, h]: number[]) => (v ?? 0) * strength - (h ?? 0) * 6), spring);
  const rotateX = useSpring(useTransform(my, (v) => v * -4), spring);
  const rotateY = useSpring(useTransform(mx, (v) => v * 4), spring);

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduce || e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width - 0.5) * 2 * 0.5);
    my.set(((e.clientY - r.top) / r.height - 0.5) * 2 * 0.5);
  }

  function onEnter(e: React.PointerEvent<HTMLDivElement>) {
    if (reduce || e.pointerType !== "mouse") return;
    hover.set(1);
  }

  function onLeave() {
    mx.set(0);
    my.set(0);
    hover.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      style={{ x, y, rotateX, rotateY, transformPerspective: 900 }}
      className={cn("will-change-transform", className)}
    >
      {children}
    </motion.div>
  );
}
