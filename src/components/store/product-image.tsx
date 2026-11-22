"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

const FALLBACK_IMAGE = "/images/products/lokal-sigaluh.webp";
const WHITELISTED_HOSTS = new Set(["images.unsplash.com", "res.cloudinary.com", "i.imgur.com"]);
const CUSTOM_SUPABASE_HOST = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : undefined;
  } catch {
    return undefined;
  }
})();

function isNextImageSupported(src: string): boolean {
  if (src.startsWith("/")) return true;
  try {
    const { protocol, hostname } = new URL(src);
    if (protocol !== "https:") return false;
    if (hostname.endsWith(".supabase.co")) return true;
    if (CUSTOM_SUPABASE_HOST && hostname === CUSTOM_SUPABASE_HOST) return true;
    return WHITELISTED_HOSTS.has(hostname);
  } catch {
    return false;
  }
}

export function ProductImage({
  src,
  alt,
  fill = false,
  width,
  height,
  sizes = "(max-width: 768px) 100vw, 33vw",
  priority = false,
  className,
}: {
  src: string | null | undefined;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const initial = src?.trim() ? src.trim() : FALLBACK_IMAGE;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const resolved = failedSrc === initial ? FALLBACK_IMAGE : initial;

  if (!isNextImageSupported(resolved)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolved}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        onError={() => setFailedSrc(initial)}
        className={cn(fill ? "absolute inset-0 size-full object-cover" : "object-cover", className)}
      />
    );
  }

  if (fill) {
    return (
      <Image
        src={resolved}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        onError={() => setFailedSrc(initial)}
        className={cn("object-cover", className)}
      />
    );
  }

  return (
    <Image
      src={resolved}
      alt={alt}
      width={width ?? 800}
      height={height ?? 800}
      sizes={sizes}
      priority={priority}
      onError={() => setFailedSrc(initial)}
      className={cn("object-cover", className)}
    />
  );
}
