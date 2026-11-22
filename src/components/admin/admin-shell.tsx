"use client";

import {
  AlertTriangle,
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareQuote,
  Package,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Dialog, DialogClose, DialogDescription, DialogTitle, SheetContent } from "@/components/ui/dialog";
import { signOut } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Ringkasan", icon: LayoutDashboard },
  { href: "/admin/produk", label: "Katalog & Stok", icon: Package },
  { href: "/admin/pesanan", label: "Pesanan WA", icon: ClipboardList },
  { href: "/admin/pengaturan", label: "Pengaturan Toko", icon: Settings },
  { href: "/admin/testimoni", label: "Testimoni", icon: MessageSquareQuote },
] as const;

function SidebarBody({
  pathname,
  userEmail,
  configured,
  onNavigate,
}: {
  pathname: string;
  userEmail: string;
  configured: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col justify-between bg-orchard p-5 text-cream">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-2 border-b border-cream/10 pb-4">
          <Link href="/admin" onClick={onNavigate} className="space-y-0.5">
            <span className="block font-display text-xl font-bold text-cream">AgungDurian</span>
            <span className="block text-[11px] font-medium text-gold">Panel Pengelola Kebun</span>
          </Link>
        </div>

        <nav className="space-y-1" aria-label="Menu admin">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-gold text-orchard font-semibold shadow-soft"
                    : "text-cream/75 hover:bg-cream/10 hover:text-cream",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-3 border-t border-cream/10 pt-4">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-2xl border border-cream/15 bg-cream/5 px-3.5 py-2.5 text-xs font-semibold text-custard transition hover:border-gold/50"
        >
          <span>Lihat Toko Publik</span>
          <ExternalLink className="size-3.5" />
        </Link>

        <div className="rounded-2xl bg-orchard-2 px-3.5 py-3 text-xs">
          <p className="text-[10px] uppercase tracking-wider text-cream/50">Akun Aktif</p>
          <p className="mt-0.5 truncate font-medium text-cream">{userEmail}</p>
        </div>

        {configured ? (
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-full border border-cream/15 py-2 text-xs font-semibold text-cream/80 transition hover:bg-crimson hover:border-crimson hover:text-white"
            >
              <LogOut className="size-3.5" />
              Keluar
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}

export function AdminShell({
  userEmail,
  configured,
  children,
}: {
  userEmail: string;
  configured: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-cream text-bark lg:flex">
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-0 h-dvh">
          <SidebarBody pathname={pathname} userEmail={userEmail} configured={configured} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-orchard/10 bg-cream/90 px-4 backdrop-blur lg:hidden">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="grid size-9 place-items-center rounded-xl border border-orchard/15 bg-white text-orchard"
              aria-label="Buka menu admin"
            >
              <Menu className="size-4" />
            </button>
            <span className="font-display text-lg font-bold text-orchard">Admin AgungDurian</span>
          </div>
          <Link href="/" className="text-xs font-semibold text-orchard hover:underline">
            Lihat Toko
          </Link>
        </header>

        {!configured ? (
          <div className="border-b border-gold/40 bg-custard/80 px-4 py-3 text-xs text-orchard sm:px-8">
            <div className="mx-auto flex max-w-6xl items-center gap-2.5">
              <AlertTriangle className="size-4 shrink-0 text-gold-hover" />
              <p>
                <strong>Mode Pratinjau Lokal:</strong> Supabase belum terhubung. Data contoh ditampilkan untuk pratinjau
                UI. Ikuti <code className="rounded bg-orchard/10 px-1 font-mono">SETUP_GUIDE.md</code> dan isi{" "}
                <code className="rounded bg-orchard/10 px-1 font-mono">.env.local</code> untuk mengaktifkan penyimpanan
                &amp; autentikasi penuh.
              </p>
            </div>
          </div>
        ) : null}

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>

      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent className="max-w-xs p-0">
          <DialogTitle className="sr-only">Navigasi Admin</DialogTitle>
          <DialogDescription className="sr-only">Pilih menu manajemen toko</DialogDescription>
          <div className="relative h-full">
            <SidebarBody
              pathname={pathname}
              userEmail={userEmail}
              configured={configured}
              onNavigate={() => setMobileOpen(false)}
            />
            <DialogClose className="absolute right-4 top-4 rounded-full bg-cream/10 px-2.5 py-1 text-xs text-cream">
              Tutup
            </DialogClose>
          </div>
        </SheetContent>
      </Dialog>
    </div>
  );
}
