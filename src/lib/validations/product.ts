import { z } from "zod";

const taste = z.coerce.number().int().min(1).max(5);
const money = z.coerce.number().int({ error: "Harus bilangan bulat" }).min(0, { error: "Tidak boleh negatif" }).max(100_000_000);

const imageUrl = z
  .string()
  .trim()
  .max(1000)
  .refine((v) => v === "" || v.startsWith("/") || /^https:\/\/[^\s]+$/i.test(v), {
    error: "Gunakan URL https:// atau path lokal (/images/...)",
  })
  .transform((v) => (v === "" ? null : v));

export const productSchema = z
  .object({
    name: z.string().trim().min(2, { error: "Nama produk minimal 2 karakter" }).max(120),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { error: "Slug hanya huruf kecil, angka, dan tanda hubung" })
      .max(80),
    variety_category: z.enum(["lokal", "premium", "kupas"]),
    description: z.string().trim().max(1200).default(""),
    origin_notes: z.string().trim().max(800).default(""),
    image_url: imageUrl,
    allow_butir: z.boolean(),
    price_butir: money,
    avg_weight_kg: z.coerce.number().min(0.3, { error: "Min 0,3 kg" }).max(10),
    stock_butir: z.coerce.number().int().min(0).max(100_000),
    allow_gram: z.boolean(),
    price_per_100g: money,
    stock_gram: z.coerce.number().int().min(0).max(1_000_000),
    min_gram: z.coerce.number().int().min(50).max(5000),
    max_gram: z.coerce.number().int().min(100).max(10000),
    taste_sweet: taste,
    taste_creamy: taste,
    taste_bitter: taste,
    taste_thickness: taste,
    badge: z
      .string()
      .trim()
      .max(30)
      .transform((v) => (v === "" ? null : v))
      .nullable()
      .default(null),
    is_featured: z.boolean(),
    is_active: z.boolean(),
    sort_order: z.coerce.number().int().min(0).max(9999).default(0),
  })
  .superRefine((v, ctx) => {
    if (!v.allow_butir && !v.allow_gram) {
      ctx.addIssue({ code: "custom", path: ["allow_butir"], message: "Aktifkan minimal satu mode jual" });
    }
    if (v.allow_butir && v.price_butir <= 0) {
      ctx.addIssue({ code: "custom", path: ["price_butir"], message: "Harga per butir wajib diisi" });
    }
    if (v.allow_gram && v.price_per_100g <= 0) {
      ctx.addIssue({ code: "custom", path: ["price_per_100g"], message: "Harga per 100g wajib diisi" });
    }
    if (v.max_gram < v.min_gram) {
      ctx.addIssue({ code: "custom", path: ["max_gram"], message: "Maksimal gram harus ≥ minimal gram" });
    }
  });

export type ProductFormInput = z.input<typeof productSchema>;
export type ProductFormOutput = z.output<typeof productSchema>;

export const stockAdjustSchema = z.object({
  productId: z.uuid(),
  field: z.enum(["stock_butir", "stock_gram"]),
  delta: z.number().int().min(-100_000).max(100_000),
});

export const productToggleSchema = z.object({
  productId: z.uuid(),
  field: z.enum(["is_active", "is_featured"]),
  value: z.boolean(),
});
