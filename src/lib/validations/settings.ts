import { z } from "zod";

import { phoneSchema } from "@/lib/validations/order";

export const settingsSchema = z.object({
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
  harvest_status: z.enum(["panen_raya", "stok_terbatas", "pre_order"]),
  harvest_banner_text: z.string().trim().min(5, { error: "Teks banner wajib diisi" }).max(200),
  marquee_items: z
    .array(z.string().trim().min(2).max(60))
    .min(1, { error: "Minimal satu kalimat ticker" })
    .max(20, { error: "Maksimal 20 kalimat" }),
  hero_headline: z.string().trim().min(5, { error: "Headline wajib diisi" }).max(120),
  hero_subheadline: z.string().trim().max(400),
  google_rating: z.coerce.number().min(0).max(5),
  google_review_count: z.coerce.number().int().min(0).max(100000),
});

export type SettingsFormInput = z.input<typeof settingsSchema>;
