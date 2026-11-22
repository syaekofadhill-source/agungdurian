import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

/** Rp 85.000 */
export function formatRupiah(value: number): string {
  return rupiahFormatter.format(Math.round(value)).replace(/\u00a0/g, " ");
}

/** 85.000 */
export function formatNumber(value: number): string {
  return numberFormatter.format(Math.round(value));
}

/** 4.500g · 1,5 kg */
export function formatGram(grams: number): string {
  if (grams >= 1000 && grams % 100 === 0) {
    return `${(grams / 1000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} kg`;
  }
  return `${numberFormatter.format(grams)}g`;
}

/**
 * Normalises Indonesian phone input to the international `62xxx` format.
 * "0813-9109 4308" → "6281391094308", "+62 813…" → "62813…", "813…" → "62813…"
 */
export function sanitizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}

/** "6281391094308" → "+62 813-9109-4308" */
export function prettyPhone(phone: string): string {
  const d = sanitizePhone(phone);
  if (!d.startsWith("62")) return phone;
  const local = d.slice(2);
  return `+62 ${local.slice(0, 3)}-${local.slice(3, 7)}-${local.slice(7)}`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}

export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return url.replace(/\/$/, "");
}
