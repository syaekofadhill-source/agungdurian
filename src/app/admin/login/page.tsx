import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/admin/login-form";
import { ContourLines } from "@/components/store/ornaments";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Masuk Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const nextPath = sp.next && sp.next.startsWith("/admin") && !sp.next.startsWith("//") ? sp.next : "/admin";
  const configured = isSupabaseConfigured();

  if (configured) {
    const supabase = await createSupabaseServerClient();
    const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
    if (data.user) redirect(nextPath);
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-orchard-radial px-4 py-12">
      <ContourLines className="pointer-events-none -right-32 -top-32 absolute size-[560px] text-cream/10" />
      <div className="relative z-10 w-full max-w-md">
        <LoginForm nextPath={nextPath} configured={configured} />
      </div>
    </div>
  );
}
