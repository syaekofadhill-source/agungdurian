import { z } from "zod";

export const testimonialSchema = z.object({
  customer_name: z.string().trim().min(2, { error: "Nama minimal 2 karakter" }).max(80),
  origin_city: z.string().trim().max(60).default(""),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(5, { error: "Ulasan minimal 5 karakter" }).max(600),
  purchased_variant: z
    .string()
    .trim()
    .max(120)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .default(null),
  is_visible: z.boolean().default(true),
});

export type TestimonialFormInput = z.input<typeof testimonialSchema>;
