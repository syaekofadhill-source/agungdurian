import { z } from "zod";

export const loginSchema = z.object({
  email: z.email({ error: "Format email tidak valid" }).trim().toLowerCase(),
  password: z.string().min(6, { error: "Kata sandi minimal 6 karakter" }).max(128),
  next: z
    .string()
    .optional()
    .transform((v) => (v && v.startsWith("/admin") && !v.startsWith("//") ? v : "/admin")),
});
