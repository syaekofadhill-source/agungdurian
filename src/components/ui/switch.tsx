"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

export function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200",
        "data-[state=checked]:bg-orchard data-[state=unchecked]:bg-orchard/15 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block size-5 rounded-full bg-cream shadow-sm ring-0 transition-transform duration-200 ease-[var(--ease-organic)] data-[state=checked]:translate-x-5 data-[state=checked]:bg-gold data-[state=unchecked]:translate-x-0" />
    </SwitchPrimitive.Root>
  );
}
