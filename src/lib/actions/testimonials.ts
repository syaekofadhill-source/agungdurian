"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import { testimonialSchema, type TestimonialFormInput } from "@/lib/validations/testimonial";
import type { ActionResult } from "@/types/actions";

function revalidate() {
  revalidatePath("/");
  revalidatePath("/admin/testimoni");
}

export async function saveTestimonial(input: TestimonialFormInput, id?: string): Promise<ActionResult> {
  const parsed = testimonialSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Data testimoni belum valid.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const { supabase } = await requireAdmin();

  if (id) {
    if (!z.uuid().safeParse(id).success) return { ok: false, error: "ID tidak valid." };
    const { error } = await supabase.from("testimonials").update(parsed.data).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidate();
    return { ok: true, message: "Testimoni diperbarui." };
  }

  const { error } = await supabase.from("testimonials").insert(parsed.data);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true, message: "Testimoni ditambahkan." };
}

export async function toggleTestimonialVisibility(id: string, visible: boolean): Promise<ActionResult> {
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "ID tidak valid." };
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("testimonials").update({ is_visible: visible }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true, message: visible ? "Testimoni ditampilkan." : "Testimoni disembunyikan." };
}

export async function deleteTestimonial(id: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "ID tidak valid." };
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("testimonials").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true, message: "Testimoni dihapus." };
}
