import type { Metadata } from "next";

import { TestimonialsManager } from "@/components/admin/testimonials-manager";
import { getAdminSession, getAdminTestimonials } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Testimoni" };

export default async function AdminTestimonialsPage() {
  const [session, testimonials] = await Promise.all([getAdminSession(), getAdminTestimonials()]);
  return <TestimonialsManager testimonials={testimonials} configured={session.configured} />;
}
