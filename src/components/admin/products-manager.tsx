"use client";

import { Minus, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { ProductFormSheet } from "@/components/admin/product-form-sheet";
import { ProductImage } from "@/components/store/product-image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { adjustStock, deleteProduct, toggleProductFlag } from "@/lib/actions/products";
import { CATEGORY_FILTERS, CATEGORY_LABEL, LOW_STOCK_BUTIR, LOW_STOCK_GRAM } from "@/lib/constants";
import { cn, formatNumber, formatRupiah } from "@/lib/utils";
import type { Product, VarietyCategory } from "@/types/database";

export function ProductsManager({
  products,
  configured,
}: {
  products: Product[];
  configured: boolean;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<VarietyCategory | "semua">("semua");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== "semua" && p.variety_category !== category) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
    });
  }, [products, category, query]);

  function openCreate() {
    setEditing(null);
    setSheetOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setSheetOpen(true);
  }

  function guardDemo(): boolean {
    if (!configured) {
      toast.info("Mode pratinjau: hubungkan Supabase di .env.local untuk mengubah stok & katalog.");
      return true;
    }
    return false;
  }

  function handleStockStep(productId: string, field: "stock_butir" | "stock_gram", delta: number) {
    if (guardDemo()) return;
    startTransition(async () => {
      const res = await adjustStock({ productId, field, delta });
      if (!res.ok) toast.error(res.error);
    });
  }

  function handleToggle(productId: string, field: "is_active" | "is_featured", value: boolean) {
    if (guardDemo()) return;
    startTransition(async () => {
      const res = await toggleProductFlag({ productId, field, value });
      if (!res.ok) toast.error(res.error);
    });
  }

  function handleDelete() {
    if (!confirmDelete || guardDemo()) return;
    const target = confirmDelete;
    startTransition(async () => {
      const res = await deleteProduct(target.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message ?? "Produk dihapus.");
      setConfirmDelete(null);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-hover">Katalog &amp; Inventori</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-orchard">Manajemen Produk &amp; Stok</h1>
        </div>
        <Button variant="gold" onClick={openCreate}>
          <Plus className="size-4" />
          Tambah Varietas
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-orchard/10 bg-white/80 p-4 shadow-soft">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setCategory(f.value)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                category === f.value ? "bg-orchard text-cream" : "bg-cream-2 text-moss hover:text-orchard",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-moss" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari varietas…"
            className="h-9 w-full rounded-full border border-orchard/15 bg-cream pl-9 pr-3 text-xs outline-none focus:border-gold"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-orchard/10 bg-white/85 shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="border-b border-orchard/10 bg-cream-2/70 text-[11px] font-bold uppercase tracking-wider text-moss">
              <tr>
                <th className="px-5 py-3.5">Varietas</th>
                <th className="px-4 py-3.5">Mode Per Butir</th>
                <th className="px-4 py-3.5">Mode Per Gram</th>
                <th className="px-4 py-3.5 text-center">Unggulan</th>
                <th className="px-4 py-3.5 text-center">Status Toko</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orchard/10">
              {filtered.map((p) => {
                const lowButir = p.allow_butir && p.stock_butir <= LOW_STOCK_BUTIR;
                const lowGram = p.allow_gram && p.stock_gram <= LOW_STOCK_GRAM;
                return (
                  <tr key={p.id} className="transition hover:bg-cream/50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3.5">
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-orchard">
                          <ProductImage src={p.image_url} alt={p.name} fill sizes="48px" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-display text-base font-bold text-orchard">{p.name}</p>
                          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-moss">
                            <span>{CATEGORY_LABEL[p.variety_category]}</span>
                            {p.badge ? (
                              <span className="rounded-full bg-custard px-2 py-0.5 font-semibold text-orchard">
                                {p.badge}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      {p.allow_butir ? (
                        <div className="space-y-1.5">
                          <p className="font-mono text-xs font-bold text-orchard tabular">
                            {formatRupiah(p.price_butir)} <span className="font-normal text-moss">/butir</span>
                          </p>
                          <div className="inline-flex items-center gap-1 rounded-full border border-orchard/12 bg-cream px-1.5 py-0.5">
                            <button
                              type="button"
                              disabled={pending || p.stock_butir <= 0}
                              onClick={() => handleStockStep(p.id, "stock_butir", -1)}
                              className="grid size-6 place-items-center rounded-full text-orchard hover:bg-cream-2 disabled:opacity-35"
                              aria-label={`Kurangi stok butir ${p.name}`}
                            >
                              <Minus className="size-3" />
                            </button>
                            <span
                              className={cn(
                                "min-w-9 text-center font-mono text-xs font-bold tabular",
                                lowButir ? "text-crimson" : "text-bark",
                              )}
                            >
                              {p.stock_butir}
                            </span>
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => handleStockStep(p.id, "stock_butir", 1)}
                              className="grid size-6 place-items-center rounded-full text-orchard hover:bg-cream-2 disabled:opacity-35"
                              aria-label={`Tambah stok butir ${p.name}`}
                            >
                              <Plus className="size-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-moss/60">Nonaktif</span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      {p.allow_gram ? (
                        <div className="space-y-1.5">
                          <p className="font-mono text-xs font-bold text-orchard tabular">
                            {formatRupiah(p.price_per_100g)} <span className="font-normal text-moss">/100g</span>
                          </p>
                          <div className="inline-flex items-center gap-1 rounded-full border border-orchard/12 bg-cream px-1.5 py-0.5">
                            <button
                              type="button"
                              disabled={pending || p.stock_gram <= 0}
                              onClick={() => handleStockStep(p.id, "stock_gram", -250)}
                              className="grid size-6 place-items-center rounded-full text-orchard hover:bg-cream-2 disabled:opacity-35"
                              title="-250g"
                              aria-label={`Kurangi 250g stok ${p.name}`}
                            >
                              <Minus className="size-3" />
                            </button>
                            <span
                              className={cn(
                                "min-w-14 text-center font-mono text-xs font-bold tabular",
                                lowGram ? "text-crimson" : "text-bark",
                              )}
                            >
                              {formatNumber(p.stock_gram)}g
                            </span>
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => handleStockStep(p.id, "stock_gram", 250)}
                              className="grid size-6 place-items-center rounded-full text-orchard hover:bg-cream-2 disabled:opacity-35"
                              title="+250g"
                              aria-label={`Tambah 250g stok ${p.name}`}
                            >
                              <Plus className="size-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-moss/60">Nonaktif</span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-center">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleToggle(p.id, "is_featured", !p.is_featured)}
                        className={cn(
                          "inline-grid size-8 place-items-center rounded-full transition",
                          p.is_featured ? "bg-custard text-gold-hover" : "text-moss/40 hover:bg-cream-2",
                        )}
                        aria-label={`Tandai ${p.name} sebagai unggulan`}
                      >
                        <Star className={cn("size-4", p.is_featured && "fill-current")} />
                      </button>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <Switch
                        checked={p.is_active}
                        disabled={pending}
                        onCheckedChange={(val) => handleToggle(p.id, "is_active", val)}
                        aria-label={`Aktifkan ${p.name}`}
                      />
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          className="grid size-8 place-items-center rounded-full border border-orchard/15 bg-white text-orchard transition hover:bg-cream-2"
                          aria-label={`Edit ${p.name}`}
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(p)}
                          className="grid size-8 place-items-center rounded-full border border-orchard/15 bg-white text-moss transition hover:border-crimson/40 hover:bg-crimson/10 hover:text-crimson"
                          aria-label={`Hapus ${p.name}`}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 ? (
          <p className="p-10 text-center text-sm text-moss">Tidak ada varietas yang cocok dengan filter saat ini.</p>
        ) : null}
      </div>

      <ProductFormSheet open={sheetOpen} onOpenChange={setSheetOpen} product={editing} configured={configured} />

      <Dialog open={confirmDelete !== null} onOpenChange={(o) => { if (!o) setConfirmDelete(null); }}>
        <DialogContent className="max-w-md p-6">
          <DialogTitle className="font-display text-xl font-bold text-orchard">Hapus Varietas?</DialogTitle>
          <DialogDescription className="mt-2 text-sm text-moss">
            Produk <strong>{confirmDelete?.name}</strong> akan dihapus permanen dari katalog. Untuk menyembunyikan
            sementara tanpa menghapus, cukup matikan sakelar Status Toko.
          </DialogDescription>
          <div className="mt-6 flex justify-end gap-2.5">
            <DialogClose className="inline-flex h-10 items-center rounded-full border border-orchard/15 px-4 text-xs font-semibold">
              Batal
            </DialogClose>
            <Button variant="danger" disabled={pending} onClick={handleDelete}>
              {pending ? "Menghapus…" : "Ya, Hapus"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
