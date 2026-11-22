"use client";

import { MotionConfig } from "framer-motion";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      {children}
      <Toaster
        position="top-center"
        richColors
        closeButton
        toastOptions={{
          classNames: {
            toast: "!font-sans !rounded-2xl !border-cream-3 !shadow-lift",
            title: "!font-semibold",
          },
        }}
      />
    </MotionConfig>
  );
}
