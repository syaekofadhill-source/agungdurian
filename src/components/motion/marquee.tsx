import { cn } from "@/lib/utils";

/**
 * Seamless infinite marquee. The content is duplicated and the track translates
 * exactly -50% so the loop has no visible seam. Pure CSS (compositor thread),
 * pauses on hover, and is disabled automatically for prefers-reduced-motion.
 */
export function Marquee({
  items,
  className,
  itemClassName,
  durationSec = 45,
  separator,
}: {
  items: string[];
  className?: string;
  itemClassName?: string;
  durationSec?: number;
  separator?: React.ReactNode;
}) {
  const sep = separator ?? (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-gold" aria-hidden>
      <path d="M12 2c1 4 3 6 7 7-4 1-6 3-7 7-1-4-3-6-7-7 4-1 6-3 7-7z" fill="currentColor" />
    </svg>
  );

  const renderGroup = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center gap-8 pr-8" aria-hidden={hidden || undefined}>
      {items.map((item, i) => (
        <li key={`${item}-${i}`} className={cn("flex items-center gap-8 whitespace-nowrap", itemClassName)}>
          <span>{item}</span>
          {sep}
        </li>
      ))}
    </ul>
  );

  return (
    <div
      className={cn(
        "group relative flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]",
        className,
      )}
    >
      <div
        className="marquee-track flex w-max animate-marquee will-change-transform"
        style={{ ["--marquee-duration" as string]: `${durationSec}s` }}
      >
        {renderGroup(false)}
        {renderGroup(true)}
      </div>
    </div>
  );
}
