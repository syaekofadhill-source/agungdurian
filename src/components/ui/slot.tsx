import { Children, cloneElement, isValidElement } from "react";

import { cn } from "@/lib/utils";

type SlotProps = React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode };

/** Minimal `asChild` slot: merges className & props onto the single child element. */
export function Slot({ children, className, ...props }: SlotProps) {
  const child = Children.only(children);
  if (!isValidElement<{ className?: string }>(child)) return null;
  return cloneElement(child, {
    ...props,
    ...child.props,
    className: cn(className, child.props.className),
  });
}
