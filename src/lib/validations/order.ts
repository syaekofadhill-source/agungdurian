import { z } from "zod";

import { sanitizePhone } from "@/lib/utils";

export const phoneSchema = z
  .string({ error: "Nomor HP wajib diisi" })
  .trim()
  .min(8, { error: "Nomor HP terlalu pendek" })
  .transform(sanitizePhone)
  .refine((v) => /^62[0-9]{8,13}$/.test(v), {
    error: "Format nomor HP tidak valid (contoh: 0813xxxxxxx)",
  });

const uuid = z.string().regex(/^[0-9a-f-]{36}$/i, { error: "ID produk tidak valid" });

export const cartItemSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("butir"),
    productId: uuid,
    size: z.enum(["sedang", "besar", "jumbo"]),
    preparation: z.enum(["utuh", "kupas"]),
    quantity: z.number().int().min(1).max(50),
  }),
  z.object({
    mode: z.literal("gram"),
    productId: uuid,
    grams: z.number().int().min(50).max(10000).multipleOf(50),
    packaging: z.enum(["thinwall", "vacuum"]),
    quantity: z.number().int().min(1).max(20),
  }),
]);

export type CartItemInput = z.infer<typeof cartItemSchema>;

export const checkoutSchema = z
  .object({
    customerName: z
      .string({ error: "Nama wajib diisi" })
      .trim()
      .min(2, { error: "Nama minimal 2 karakter" })
      .max(80, { error: "Nama maksimal 80 karakter" }),
    customerPhone: phoneSchema,
    deliveryMethod: z.enum(["pickup", "local_delivery", "shipping_vacuum"], {
      error: "Pilih metode pengambilan",
    }),
    deliveryAddress: z.string().trim().max(400, { error: "Alamat terlalu panjang" }).optional().default(""),
    notes: z.string().trim().max(400, { error: "Catatan terlalu panjang" }).optional().default(""),
    items: z.array(cartItemSchema).min(1, { error: "Keranjang masih kosong" }).max(30),
  })
  .superRefine((val, ctx) => {
    if (val.deliveryMethod !== "pickup" && val.deliveryAddress.length < 10) {
      ctx.addIssue({
        code: "custom",
        path: ["deliveryAddress"],
        message: "Alamat lengkap wajib diisi untuk pengantaran (min. 10 karakter)",
      });
    }
  });

export type CheckoutInput = z.input<typeof checkoutSchema>;

export const orderStatusSchema = z.object({
  orderId: uuid,
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
  deductStock: z.boolean().default(true),
});
