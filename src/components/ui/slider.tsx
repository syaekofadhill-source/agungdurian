"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

export function Slider({ className, ...props }: React.ComponentProps<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root
      className={cn("relative flex h-6 w-full touch-none select-none items-center", className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-orchard/10">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-gradient-to-r from-gold/80 to-gold" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className="block size-6 rounded-full border-[3px] border-gold bg-cream shadow-[0_4px_14px_-2px_rgb(232_168_23/0.6)] transition-transform duration-150 hover:scale-110 focus-visible:scale-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/30 active:scale-95"
        aria-label="Atur gramasi"
      />
    </SliderPrimitive.Root>
  );
}
