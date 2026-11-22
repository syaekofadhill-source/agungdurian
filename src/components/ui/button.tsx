import { Slot } from "./slot";
import { cn } from "@/lib/utils";

type Variant = "gold" | "orchard" | "outline" | "ghost" | "cream" | "danger" | "link";
type Size = "sm" | "md" | "lg" | "icon" | "icon-sm";

const variants: Record<Variant, string> = {
  gold: "bg-gold text-orchard hover:bg-gold-hover shadow-gold/0 hover:shadow-gold",
  orchard: "bg-orchard text-cream hover:bg-orchard-2",
  outline: "border border-orchard/15 bg-transparent text-bark hover:border-orchard/40 hover:bg-orchard/[0.03]",
  ghost: "bg-transparent text-bark hover:bg-orchard/5",
  cream: "bg-cream text-orchard hover:bg-custard",
  danger: "bg-crimson text-white hover:bg-crimson/90",
  link: "bg-transparent text-orchard underline-offset-4 hover:underline px-0 h-auto",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5 rounded-full",
  md: "h-11 px-5 text-sm gap-2 rounded-full",
  lg: "h-13 px-7 text-base gap-2.5 rounded-full",
  icon: "size-11 rounded-full",
  "icon-sm": "size-8 rounded-full",
};

export type ButtonProps = React.ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
};

export function buttonVariants({ variant = "gold", size = "md" }: { variant?: Variant; size?: Size } = {}) {
  return cn(
    "inline-flex shrink-0 items-center justify-center whitespace-nowrap font-semibold tracking-tight",
    "transition-[background-color,box-shadow,color,border-color,transform] duration-200 ease-[var(--ease-organic)]",
    "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    variants[variant],
    sizes[size],
  );
}

export function Button({ className, variant, size, asChild, type, ...props }: ButtonProps) {
  if (asChild) {
    return <Slot className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  }
  return <button type={type ?? "button"} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
