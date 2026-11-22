"use client";

import { ArrowLeft, Info, Lock, LogIn } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { signIn } from "@/lib/actions/auth";

export function LoginForm({ nextPath, configured }: { nextPath: string; configured: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const res = await signIn({ email, password, next: nextPath });
      if (!res.ok) {
        setError(res.error);
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
      }
    });
  }

  return (
    <div className="w-full max-w-md space-y-6 rounded-[2rem] border border-orchard/10 bg-white/90 p-7 shadow-lift backdrop-blur sm:p-9">
      <div className="space-y-2">
        <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-orchard text-gold shadow-soft">
          <Lock className="size-5" />
        </div>
        <h1 className="font-display text-2xl font-bold text-orchard sm:text-3xl">Masuk Panel Admin</h1>
        <p className="text-sm text-moss">Kelola katalog durian, stok harian, pesanan WA, dan pengaturan toko.</p>
      </div>

      {!configured ? (
        <div className="space-y-3 rounded-2xl border border-gold/40 bg-custard/65 p-4 text-xs text-orchard">
          <p className="flex items-start gap-2 font-semibold">
            <Info className="mt-0.5 size-4 shrink-0 text-gold-hover" />
            <span>Supabase belum dikonfigurasi di .env.local</span>
          </p>
          <p className="leading-relaxed text-bark/80">
            Ikuti <code className="rounded bg-orchard/10 px-1.5 py-0.5 font-mono">SETUP_GUIDE.md</code> untuk
            menghubungkan autentikasi &amp; database, atau buka pratinjau dashboard dalam mode demo.
          </p>
          <Link
            href="/admin"
            className="inline-flex h-9 items-center rounded-full bg-orchard px-4 text-xs font-semibold text-cream transition hover:bg-orchard-2"
          >
            Buka Pratinjau Mode Demo →
          </Link>
        </div>
      ) : null}

      {error ? (
        <div role="alert" className="rounded-2xl border border-crimson/25 bg-crimson/10 px-4 py-3 text-xs font-medium text-crimson">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email Admin" htmlFor="login-email" error={fieldErrors.email}>
          <Input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@agungdurian.id"
          />
        </Field>

        <Field label="Kata Sandi" htmlFor="login-password" error={fieldErrors.password}>
          <Input
            id="login-password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </Field>

        <Button type="submit" variant="gold" size="lg" className="w-full" disabled={pending || !configured}>
          <LogIn className="size-4" />
          {pending ? "Memverifikasi…" : "Masuk ke Dashboard"}
        </Button>
      </form>

      <div className="border-t border-orchard/10 pt-4 text-center">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-orchard hover:underline">
          <ArrowLeft className="size-3.5" />
          Kembali ke Toko Publik
        </Link>
      </div>
    </div>
  );
}
