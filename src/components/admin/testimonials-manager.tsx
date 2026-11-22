"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { StarRow } from "@/components/store/ornaments";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import {
  deleteTestimonial,
  saveTestimonial,
  toggleTestimonialVisibility,
} from "@/lib/actions/testimonials";
import type { Testimonial } from "@/types/database";

function TestimonialFormBody({
  testimonial,
  configured,
  onSuccess,
}: {
  testimonial: Testimonial | null;
  configured: boolean;
  onSuccess: () => void;
}) {
  const [customerName, setCustomerName] = useState(testimonial?.customer_name ?? "");
  const [originCity, setOriginCity] = useState(testimonial?.origin_city ?? "");
  const [rating, setRating] = useState(String(testimonial?.rating ?? 5));
  const [purchasedVariant, setPurchasedVariant] = useState(testimonial?.purchased_variant ?? "");
  const [comment, setComment] = useState(testimonial?.comment ?? "");
  const [isVisible, setIsVisible] = useState(testimonial?.is_visible ?? true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) {
      toast.info("Mode pratinjau: hubungkan Supabase di .env.local untuk menyimpan testimoni.");
      return;
    }

    setFieldErrors({});
    startTransition(async () => {
      const res = await saveTestimonial(
        {
          customer_name: customerName,
          origin_city: originCity,
          rating: Number(rating) || 5,
          purchased_variant: purchasedVariant.trim() ? purchasedVariant : null,
          comment,
          is_visible: isVisible,
        },
        testimonial?.id,
      );

      if (!res.ok) {
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        toast.error(res.error);
        return;
      }

      toast.success(res.message ?? "Testimoni tersimpan.");
      onSuccess();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nama Pembeli" htmlFor="t-name" error={fieldErrors.customer_name}>
          <Input id="t-name" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        </Field>
        <Field label="Asal Kota" htmlFor="t-city" error={fieldErrors.origin_city}>
          <Input
            id="t-city"
            value={originCity}
            onChange={(e) => setOriginCity(e.target.value)}
            placeholder="Purwokerto / Semarang"
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Rating Bintang" htmlFor="t-rating" error={fieldErrors.rating}>
          <Select id="t-rating" value={rating} onChange={(e) => setRating(e.target.value)}>
            <option value="5">5 Bintang</option>
            <option value="4">4 Bintang</option>
            <option value="3">3 Bintang</option>
            <option value="2">2 Bintang</option>
            <option value="1">1 Bintang</option>
          </Select>
        </Field>
        <Field label="Varian Dibeli (Opsional)" htmlFor="t-var" error={fieldErrors.purchased_variant}>
          <Input
            id="t-var"
            value={purchasedVariant}
            onChange={(e) => setPurchasedVariant(e.target.value)}
            placeholder="Durian Bawor · 2 butir"
          />
        </Field>
      </div>

      <Field label="Komentar / Ulasan" htmlFor="t-comment" error={fieldErrors.comment}>
        <Textarea id="t-comment" required value={comment} onChange={(e) => setComment(e.target.value)} />
      </Field>

      <div className="flex items-center justify-between rounded-2xl border border-orchard/10 bg-cream-2/60 px-4 py-3">
        <span className="text-xs font-semibold text-orchard">Tampilkan di Halaman Utama</span>
        <Switch checked={isVisible} onCheckedChange={setIsVisible} aria-label="Tampilkan testimoni" />
      </div>

      <div className="flex justify-end gap-2.5 pt-2">
        <DialogClose className="inline-flex h-10 items-center rounded-full border border-orchard/15 px-4 text-xs font-semibold">
          Batal
        </DialogClose>
        <Button type="submit" variant="gold" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan Testimoni"}
        </Button>
      </div>
    </form>
  );
}

export function TestimonialsManager({
  testimonials,
  configured,
}: {
  testimonials: Testimonial[];
  configured: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Testimonial | null>(null);
  const [pending, startTransition] = useTransition();

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(item: Testimonial) {
    setEditing(item);
    setModalOpen(true);
  }

  function handleVisibility(id: string, visible: boolean) {
    if (!configured) {
      toast.info("Mode pratinjau: hubungkan Supabase di .env.local untuk mengubah visibilitas.");
      return;
    }
    startTransition(async () => {
      const res = await toggleTestimonialVisibility(id, visible);
      if (!res.ok) toast.error(res.error);
      else if (res.message) toast.success(res.message);
    });
  }

  function handleDelete() {
    if (!confirmDelete) return;
    if (!configured) {
      toast.info("Mode pratinjau: hubungkan Supabase di .env.local untuk menghapus.");
      return;
    }
    const target = confirmDelete;
    startTransition(async () => {
      const res = await deleteTestimonial(target.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message ?? "Testimoni dihapus.");
      setConfirmDelete(null);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-hover">Kepercayaan Pembeli</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-orchard">Manajemen Testimoni</h1>
        </div>
        <Button variant="gold" onClick={openCreate}>
          <Plus className="size-4" />
          Tambah Testimoni
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {testimonials.map((item) => (
          <article
            key={item.id}
            className="flex flex-col justify-between rounded-3xl border border-orchard/10 bg-white/85 p-6 shadow-soft"
          >
            <div>
              <div className="flex items-center justify-between gap-3">
                <StarRow rating={item.rating} />
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-moss">
                    {item.is_visible ? "Tampil" : "Tersembunyi"}
                  </span>
                  <Switch
                    checked={item.is_visible}
                    disabled={pending}
                    onCheckedChange={(v) => handleVisibility(item.id, v)}
                    aria-label={`Tampilkan ulasan ${item.customer_name}`}
                  />
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-bark/90">&ldquo;{item.comment}&rdquo;</p>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-orchard/10 pt-4">
              <div>
                <p className="font-display text-base font-bold text-orchard">{item.customer_name}</p>
                <p className="text-xs text-moss">
                  {[item.origin_city, item.purchased_variant].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => openEdit(item)}
                  className="grid size-8 place-items-center rounded-full border border-orchard/15 bg-white text-orchard hover:bg-cream-2"
                  aria-label={`Edit testimoni ${item.customer_name}`}
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(item)}
                  className="grid size-8 place-items-center rounded-full border border-orchard/15 bg-white text-moss hover:border-crimson/40 hover:text-crimson"
                  aria-label={`Hapus testimoni ${item.customer_name}`}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg p-6">
          <DialogTitle className="font-display text-xl font-bold text-orchard">
            {editing ? `Edit Testimoni ${editing.customer_name}` : "Tambah Testimoni Pembeli"}
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs text-moss">
            Ulasan yang aktif otomatis muncul di beranda toko.
          </DialogDescription>
          <TestimonialFormBody
            key={editing?.id ?? "new"}
            testimonial={editing}
            configured={configured}
            onSuccess={() => setModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete !== null} onOpenChange={(o) => { if (!o) setConfirmDelete(null); }}>
        <DialogContent className="max-w-md p-6">
          <DialogTitle className="font-display text-xl font-bold text-orchard">Hapus Testimoni?</DialogTitle>
          <DialogDescription className="mt-2 text-sm text-moss">
            Ulasan dari <strong>{confirmDelete?.customer_name}</strong> akan dihapus permanen.
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
