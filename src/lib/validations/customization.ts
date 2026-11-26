import { z } from "zod";

const money = z.coerce.number().int({ error: "Harus bilangan bulat" }).min(0).max(50_000_000);

export const customOptionSchema = z.object({
  option_type: z.enum(["packing", "preparation", "butir_grade", "checkout_addon", "category"]),
  code: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { error: "Kode hanya huruf kecil, angka, dan tanda hubung" })
    .max(60),
  name: z.string().trim().min(1, { error: "Nama opsi wajib diisi" }).max(100),
  description: z.string().trim().max(300).default(""),
  applies_to: z.enum(["butir", "gram", "both", "order"]).default("both"),
  extra_price: money.default(0),
  price_multiplier: z.coerce.number().min(0.1).max(10).default(1),
  weight_label: z
    .string()
    .trim()
    .max(40)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .default(null),
  badge: z
    .string()
    .trim()
    .max(40)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .default(null),
  is_default: z.boolean().default(false),
  is_active: z.boolean().default(true),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
});

export type CustomOptionInput = z.input<typeof customOptionSchema>;

export const deliveryZoneSchema = z.object({
  name: z.string().trim().min(2, { error: "Nama zona wajib diisi" }).max(100),
  description: z.string().trim().max(300).default(""),
  shipping_fee: money,
  estimated_time: z.string().trim().max(60).default(""),
  allow_cod: z.boolean().default(true),
  is_active: z.boolean().default(true),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
});

export type DeliveryZoneInput = z.input<typeof deliveryZoneSchema>;

export const promoVoucherSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{3,32}$/, { error: "Kode promo hanya huruf kapital, angka, _ atau - (3-32 karakter)" }),
    description: z.string().trim().max(240).default(""),
    discount_type: z.enum(["percent", "fixed"]),
    discount_value: z.coerce.number().int().min(1, { error: "Nilai diskon minimal 1" }).max(50_000_000),
    max_discount: z
      .union([z.coerce.number().int().min(1), z.literal(""), z.null()])
      .transform((v) => (v === "" || v === null ? null : Number(v)))
      .optional()
      .default(null),
    min_subtotal: money.default(0),
    usage_limit: z
      .union([z.coerce.number().int().min(1), z.literal(""), z.null()])
      .transform((v) => (v === "" || v === null ? null : Number(v)))
      .optional()
      .default(null),
    is_active: z.boolean().default(true),
    expires_at: z
      .string()
      .trim()
      .transform((v) => (v === "" ? null : v))
      .nullable()
      .default(null),
  })
  .superRefine((v, ctx) => {
    if (v.discount_type === "percent" && v.discount_value > 100) {
      ctx.addIssue({
        code: "custom",
        path: ["discount_value"],
        message: "Diskon persen maksimal 100%",
      });
    }
  });

export type PromoVoucherInput = z.input<typeof promoVoucherSchema>;

export const gramPresetsSchema = z
  .array(z.coerce.number().int().min(50).max(10000))
  .min(1, { error: "Minimal satu preset gramasi" })
  .max(8, { error: "Maksimal 8 preset gramasi" });
