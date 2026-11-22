"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-orchard/10 bg-cream-2/80 p-1 text-moss",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200",
        "hover:text-orchard data-[state=active]:bg-orchard data-[state=active]:text-cream data-[state=active]:shadow-soft",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn("mt-3 outline-none focus-visible:ring-2 focus-visible:ring-gold", className)}
      {...props}
    />
  );
}
