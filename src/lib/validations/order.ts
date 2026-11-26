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

const uuid = z.string().regex(/^[0-9a-f-]{36}$/i, { error: "ID tidak valid" });

export const cartItemSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("butir"),
    productId: uuid,
    size: z.string().trim().min(1).max(60),
    preparation: z.string().trim().min(1).max(60),
    gradeId: z.string().trim().max(60).optional().nullable(),
    preparationId: z.string().trim().max(60).optional().nullable(),
    packingId: z.string().trim().max(60).optional().nullable(),
    quantity: z.number().int().min(1).max(50),
  }),
  z.object({
    mode: z.literal("gram"),
    productId: uuid,
    grams: z.number().int().min(50).max(10000).multipleOf(50),
    packaging: z.string().trim().min(1).max(60),
    packingId: z.string().trim().max(60).optional().nullable(),
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
    paymentMethod: z.enum(["dana", "cod", "ambil_di_tempat"], {
      error: "Pilih metode pembayaran",
    }),
    deliveryAddress: z.string().trim().max(400, { error: "Alamat terlalu panjang" }).optional().default(""),
    deliveryZoneId: z.string().trim().max(60).optional().nullable(),
    addonIds: z.array(z.string().trim().max(60)).max(20).optional().default([]),
    voucherCode: z.string().trim().max(32).optional().default(""),
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
    if (val.paymentMethod === "ambil_di_tempat" && val.deliveryMethod !== "pickup") {
      ctx.addIssue({
        code: "custom",
        path: ["paymentMethod"],
        message: "Bayar di kebun hanya tersedia untuk metode Ambil di Kebun Sigaluh.",
      });
    }
    if (val.paymentMethod === "cod" && val.deliveryMethod === "pickup") {
      ctx.addIssue({
        code: "custom",
        path: ["paymentMethod"],
        message: "COD hanya berlaku untuk pengantaran kurir.",
      });
    }
  });

export type CheckoutInput = z.input<typeof checkoutSchema>;

export const orderActionSchema = z
  .object({
    orderId: uuid,
    action: z.enum(["approve", "reject", "preparing", "ready_or_shipping", "completed", "cancelled"]),
    adminNote: z.string().trim().max(400, { error: "Catatan maksimal 400 karakter" }).optional().default(""),
    verifyPayment: z.boolean().default(true),
  })
  .superRefine((val, ctx) => {
    if (val.action === "reject" && val.adminNote.length < 3) {
      ctx.addIssue({
        code: "custom",
        path: ["adminNote"],
        message: "Alasan penolakan wajib diisi (minimal 3 karakter).",
      });
    }
  });

export const trackOrderQuerySchema = z
  .string({ error: "Masukkan kode pesanan atau nomor HP" })
  .trim()
  .min(6, { error: "Masukkan minimal 6 karakter (contoh: AGD-20261125-XXXX atau 0813xxxxxxx)" })
  .max(40);
