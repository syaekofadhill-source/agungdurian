import { z } from "zod";

import { phoneSchema } from "@/lib/validations/order";

const assetUrl = z
  .string()
  .trim()
  .max(1000)
  .refine((v) => v === "" || v.startsWith("/") || /^https:\/\/[^\s]+$/i.test(v), {
    error: "Gunakan URL https:// atau path lokal (/images/...)",
  })
  .transform((v) => (v === "" ? null : v));

const requiredAssetUrl = z
  .string()
  .trim()
  .max(1000)
  .refine((v) => v.startsWith("/") || /^https:\/\/[^\s]+$/i.test(v), {
    error: "Gunakan URL https:// atau path lokal (/images/...)",
  });

export const whyItemSchema = z.object({
  title: z.string().trim().min(3, { error: "Judul kartu minimal 3 karakter" }).max(120),
  description: z.string().trim().min(8, { error: "Deskripsi minimal 8 karakter" }).max(320),
  badge: z.string().trim().min(2, { error: "Label badge minimal 2 karakter" }).max(60),
  icon: z.enum(["shield", "sprout", "scale", "truck"]),
});

export const storeMediaSchema = z.object({
  hero_image_url: requiredAssetUrl,
  logo_image_url: assetUrl,
  og_image_url: requiredAssetUrl,
  story_image_url: assetUrl,
  location_image_url: assetUrl,
  dana_qr_image_url: assetUrl,
});

export type StoreMediaInput = z.input<typeof storeMediaSchema>;

export const storeContentSchema = z.object({
  harvest_status: z.enum(["panen_raya", "stok_terbatas", "pre_order"]),
  harvest_banner_text: z.string().trim().min(5, { error: "Teks banner minimal 5 karakter" }).max(200),
  hero_badge_text: z.string().trim().min(2, { error: "Teks badge hero minimal 2 karakter" }).max(50),
  hero_headline: z.string().trim().min(5, { error: "Headline wajib diisi" }).max(140),
  hero_subheadline: z.string().trim().max(400),
  cta_primary_text: z.string().trim().min(2, { error: "Teks tombol CTA wajib diisi" }).max(40),
  marquee_items: z
    .array(z.string().trim().min(2).max(60))
    .min(1, { error: "Minimal satu kalimat ticker" })
    .max(20, { error: "Maksimal 20 kalimat" }),
  why_items_json: z
    .array(whyItemSchema)
    .length(4, { error: "Harus tepat 4 kartu keunggulan" }),
  footer_description: z.string().trim().min(10, { error: "Deskripsi footer minimal 10 karakter" }).max(320),
});

export type StoreContentInput = z.input<typeof storeContentSchema>;

export const storeGeneralPaymentSchema = z
  .object({
    store_name: z.string().trim().min(2, { error: "Nama toko wajib diisi" }).max(60),
    tagline: z.string().trim().max(140),
    whatsapp_number: phoneSchema,
    instagram_handle: z
      .string()
      .trim()
      .transform((v) => v.replace(/^@/, ""))
      .refine((v) => v === "" || /^[a-zA-Z0-9._]{1,30}$/.test(v), { error: "Username Instagram tidak valid" }),
    address: z.string().trim().min(5, { error: "Alamat wajib diisi" }).max(300),
    maps_url: z
      .string()
      .trim()
      .refine((v) => /^https:\/\/[^\s]+$/i.test(v), { error: "URL Google Maps harus diawali https://" }),
    opening_hours: z.string().trim().min(3).max(120),
    google_rating: z.coerce.number().min(0).max(5),
    google_review_count: z.coerce.number().int().min(0).max(100000),
    payment_dana_enabled: z.boolean(),
    payment_dana_number: z.string().trim().max(30),
    payment_dana_holder: z.string().trim().max(80),
    payment_dana_instructions: z.string().trim().max(400),
    payment_cod_enabled: z.boolean(),
    payment_cod_notes: z.string().trim().max(300),
    payment_pickup_enabled: z.boolean(),
    payment_pickup_notes: z.string().trim().max(300),
  })
  .superRefine((v, ctx) => {
    if (!v.payment_dana_enabled && !v.payment_cod_enabled && !v.payment_pickup_enabled) {
      ctx.addIssue({
        code: "custom",
        path: ["payment_dana_enabled"],
        message: "Aktifkan minimal satu metode pembayaran.",
      });
    }
    if (v.payment_dana_enabled) {
      if (v.payment_dana_number.replace(/\D/g, "").length < 8) {
        ctx.addIssue({
          code: "custom",
          path: ["payment_dana_number"],
          message: "Nomor akun DANA wajib diisi (min. 8 digit).",
        });
      }
      if (v.payment_dana_holder.length < 2) {
        ctx.addIssue({
          code: "custom",
          path: ["payment_dana_holder"],
          message: "Nama pemilik akun DANA wajib diisi.",
        });
      }
    }
  });

export type StoreGeneralPaymentInput = z.input<typeof storeGeneralPaymentSchema>;
