"use client";

import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { RollingNumber } from "@/components/motion/rolling-number";
import { ProductImage } from "@/components/store/product-image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogDescription, DialogTitle, SheetContent } from "@/components/ui/dialog";
import { Field, FieldError, Input, Textarea } from "@/components/ui/field";
import { submitCheckout } from "@/lib/actions/checkout";
import { BUTIR_PREPARATION_LABEL, DELIVERY_METHOD_META, GRAM_PACKAGING_META } from "@/lib/constants";
import { getButirSize } from "@/lib/pricing";
import { cn, formatGram, formatRupiah } from "@/lib/utils";
import { selectCartCount, selectCartTotal, useCartStore } from "@/stores/cart";
import type { DeliveryMethod, StoreSettings } from "@/types/database";

type DrawerStep = "cart" | "checkout" | "success";

export function CartDrawer({ settings }: { settings: StoreSettings }) {
  const lines = useCartStore((s) => s.lines);
  const isOpen = useCartStore((s) => s.isOpen);
  const setOpen = useCartStore((s) => s.setOpen);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeLine = useCartStore((s) => s.removeLine);
  const clear = useCartStore((s) => s.clear);
  const count = useCartStore(selectCartCount);
  const total = useCartStore(selectCartTotal);

  const [step, setStep] = useState<DrawerStep>("cart");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<{
    orderCode: string;
    whatsappUrl: string;
    demo: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next && step === "success") {
      setStep("cart");
      setOrderResult(null);
      setFormError(null);
      setFieldErrors({});
    }
  }

  function handleCheckoutSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    startTransition(async () => {
      const payload = {
        customerName,
        customerPhone,
        deliveryMethod,
        deliveryAddress,
        notes,
        items: lines.map((l) =>
          l.mode === "butir"
            ? {
                mode: "butir" as const,
                productId: l.productId,
                size: l.size,
                preparation: l.preparation,
                quantity: l.quantity,
              }
            : {
                mode: "gram" as const,
                productId: l.productId,
                grams: l.grams,
                packaging: l.packaging,
                quantity: l.quantity,
              },
        ),
      };

      const res = await submitCheckout(payload);
      if (!res.ok) {
        setFormError(res.error);
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        toast.error(res.error);
        return;
      }

      if (!res.data) return;
      clear();
      setOrderResult(res.data);
      setStep("success");
      toast.success(`Pesanan ${res.data.orderCode} dibuat!`);
      window.open(res.data.whatsappUrl, "_blank", "noopener,noreferrer");
    });
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Kode pesanan disalin");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Tidak dapat menyalin otomatis");
    }
  }

  const needsAddress = DELIVERY_METHOD_META[deliveryMethod].needsAddress;

  return (
    <>
      {count > 0 && !isOpen ? (
        <div className="fixed inset-x-4 bottom-4 z-30 md:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-13 w-full items-center justify-between rounded-full bg-orchard px-5 text-cream shadow-lift ring-1 ring-gold/40"
          >
            <span className="flex items-center gap-2.5 text-sm font-semibold">
              <ShoppingBag className="size-4 text-gold" />
              <span>{count} item dipilih</span>
            </span>
            <span className="flex items-center gap-2 font-mono text-sm font-bold text-gold tabular">
              {formatRupiah(total)}
              <span className="rounded-full bg-gold px-2.5 py-0.5 font-sans text-xs text-orchard">Buka</span>
            </span>
          </button>
        </div>
      ) : null}

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <SheetContent className="p-0">
          <div className="flex items-center justify-between border-b border-orchard/10 px-6 py-4">
            <div className="flex items-center gap-2.5">
              {step === "checkout" ? (
                <button
                  type="button"
                  onClick={() => setStep("cart")}
                  className="grid size-8 place-items-center rounded-full text-orchard transition hover:bg-cream-2"
                  aria-label="Kembali ke keranjang"
                >
                  <ArrowLeft className="size-4" />
                </button>
              ) : null}
              <div>
                <DialogTitle className="font-display text-xl font-bold text-orchard">
                  {step === "cart"
                    ? "Keranjang Belanja"
                    : step === "checkout"
                      ? "Checkout WhatsApp"
                      : "Pesanan Tercatat"}
                </DialogTitle>
                <DialogDescription className="text-xs text-moss">
                  {step === "cart"
                    ? `${count} item · ${settings.store_name}`
                    : step === "checkout"
                      ? "Kode invoice dibuat otomatis sebelum buka WhatsApp"
                      : "Silakan kirim pesan WhatsApp ke admin"}
                </DialogDescription>
              </div>
            </div>
            <DialogClose className="rounded-full px-3 py-1.5 text-xs font-semibold text-moss transition hover:bg-cream-2">
              Tutup
            </DialogClose>
          </div>

          {step === "cart" ? (
            lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <span className="grid size-16 place-items-center rounded-3xl bg-cream-2 text-orchard">
                  <ShoppingBag className="size-7" />
                </span>
                <p className="mt-4 font-display text-xl font-semibold text-orchard">Keranjang masih kosong</p>
                <p className="mt-1.5 max-w-xs text-sm text-moss">
                  Pilih durian matang pohon per butir atau daging kupas per gram di katalog kebun kami.
                </p>
                <Link
                  href="/#katalog"
                  onClick={() => setOpen(false)}
                  className="mt-6 inline-flex h-11 items-center rounded-full bg-gold px-6 text-sm font-semibold text-orchard shadow-soft transition hover:bg-gold-hover"
                >
                  Lihat Katalog Panen
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-3 overflow-y-auto px-6 py-5">
                  {lines.map((line) => (
                    <div
                      key={line.key}
                      className="flex gap-3.5 rounded-2xl border border-orchard/10 bg-white/80 p-3.5 shadow-soft"
                    >
                      <div className="relative size-18 shrink-0 overflow-hidden rounded-xl bg-orchard">
                        <ProductImage src={line.imageUrl} alt={line.name} fill sizes="72px" />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-display text-sm font-bold text-orchard">{line.name}</p>
                            <p className="mt-0.5 text-xs text-moss">
                              {line.mode === "butir"
                                ? `Per Butir · ${getButirSize(line.size).label} · ${BUTIR_PREPARATION_LABEL[line.preparation]}`
                                : `Per Gram · ${formatGram(line.grams)} · ${GRAM_PACKAGING_META[line.packaging].label}`}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeLine(line.key)}
                            className="grid size-7 shrink-0 place-items-center rounded-full text-moss transition hover:bg-crimson/10 hover:text-crimson"
                            aria-label={`Hapus ${line.name}`}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between gap-2">
                          <div className="inline-flex items-center gap-1 rounded-full border border-orchard/12 bg-cream px-1.5 py-0.5">
                            <button
                              type="button"
                              onClick={() => setQuantity(line.key, line.quantity - 1)}
                              disabled={line.quantity <= 1}
                              className="grid size-6 place-items-center rounded-full text-orchard hover:bg-cream-2 disabled:opacity-35"
                              aria-label="Kurangi jumlah"
                            >
                              <Minus className="size-3" />
                            </button>
                            <span className="w-5 text-center font-mono text-xs font-bold tabular text-bark">
                              {line.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => setQuantity(line.key, line.quantity + 1)}
                              disabled={line.quantity >= line.maxQuantity}
                              className="grid size-6 place-items-center rounded-full text-orchard hover:bg-cream-2 disabled:opacity-35"
                              aria-label="Tambah jumlah"
                            >
                              <Plus className="size-3" />
                            </button>
                          </div>
                          <span className="font-mono text-sm font-bold text-orchard tabular">
                            {formatRupiah(line.unitPrice * line.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 border-t border-orchard/10 bg-cream-2/60 p-6">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-medium text-moss">Subtotal Estimasi</span>
                    <RollingNumber value={total} prefix="Rp" className="text-2xl font-bold text-orchard" />
                  </div>
                  <p className="text-[11.5px] text-moss">
                    Ongkir antar/ekspedisi vacuum dikonfirmasi oleh admin via WhatsApp sebelum pembayaran.
                  </p>
                  <Button variant="gold" size="lg" className="w-full" onClick={() => setStep("checkout")}>
                    <MessageCircle className="size-4" />
                    Lanjut ke Checkout WhatsApp
                  </Button>
                </div>
              </>
            )
          ) : step === "checkout" ? (
            <form onSubmit={handleCheckoutSubmit} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                {formError ? (
                  <div
                    role="alert"
                    className="rounded-2xl border border-crimson/25 bg-crimson/10 px-4 py-3 text-xs font-medium text-crimson"
                  >
                    {formError}
                  </div>
                ) : null}

                <div className="rounded-2xl border border-orchard/10 bg-cream-2/70 px-4 py-3 text-xs">
                  <div className="flex items-center justify-between font-semibold text-orchard">
                    <span>{count} item di keranjang</span>
                    <span className="font-mono tabular">{formatRupiah(total)}</span>
                  </div>
                </div>

                <Field label="Nama Pembeli" htmlFor="co-name" error={fieldErrors.customerName}>
                  <Input
                    id="co-name"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    aria-invalid={Boolean(fieldErrors.customerName)}
                  />
                </Field>

                <Field
                  label="Nomor WhatsApp / HP"
                  htmlFor="co-phone"
                  hint="Format otomatis ke 628xxx untuk konfirmasi pesanan."
                  error={fieldErrors.customerPhone}
                >
                  <Input
                    id="co-phone"
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="0813xxxxxxx"
                    aria-invalid={Boolean(fieldErrors.customerPhone)}
                  />
                </Field>

                <div className="space-y-2">
                  <p className="text-[13px] font-semibold text-bark">Metode Pengambilan / Kirim</p>
                  <div className="grid gap-2">
                    {(Object.keys(DELIVERY_METHOD_META) as DeliveryMethod[]).map((method) => {
                      const meta = DELIVERY_METHOD_META[method];
                      const active = deliveryMethod === method;
                      return (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setDeliveryMethod(method)}
                          className={cn(
                            "rounded-2xl border px-4 py-3 text-left transition",
                            active
                              ? "border-gold bg-custard/60 ring-1 ring-gold"
                              : "border-orchard/12 bg-white/75 hover:border-orchard/30",
                          )}
                        >
                          <span className="block text-sm font-semibold text-orchard">{meta.label}</span>
                          <span className="block text-xs text-moss">{meta.hint}</span>
                        </button>
                      );
                    })}
                  </div>
                  <FieldError messages={fieldErrors.deliveryMethod} />
                </div>

                {needsAddress ? (
                  <Field
                    label="Alamat Pengiriman Lengkap"
                    htmlFor="co-address"
                    error={fieldErrors.deliveryAddress}
                  >
                    <Textarea
                      id="co-address"
                      required
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Jalan, nomor rumah, RT/RW, kecamatan, kota, patokan…"
                      aria-invalid={Boolean(fieldErrors.deliveryAddress)}
                    />
                  </Field>
                ) : null}

                <Field label="Catatan Tambahan (Opsional)" htmlFor="co-notes" error={fieldErrors.notes}>
                  <Textarea
                    id="co-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Minta yang agak pahit, jam ambil sekitar jam 15.00 WIB…"
                    className="min-h-18"
                  />
                </Field>
              </div>

              <div className="space-y-2.5 border-t border-orchard/10 bg-cream-2/60 p-6">
                <Button type="submit" variant="gold" size="lg" className="w-full" disabled={pending}>
                  <MessageCircle className="size-4" />
                  {pending ? "Mencatat Pesanan…" : "Buat Pesanan & Buka WhatsApp"}
                </Button>
              </div>
            </form>
          ) : orderResult ? (
            <div className="flex flex-1 flex-col justify-between p-6">
              <div className="space-y-5 pt-4 text-center">
                <span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-700/12 text-emerald-800">
                  <CheckCircle2 className="size-8" />
                </span>
                <div className="space-y-1.5">
                  <h3 className="font-display text-2xl font-bold text-orchard">Pesanan Siap Dikirim!</h3>
                  <p className="text-sm text-moss">
                    Simpan kode pesanan di bawah ini dan kirim format pesan yang terbuka di WhatsApp Anda.
                  </p>
                </div>

                <div className="mx-auto flex max-w-xs items-center justify-between gap-2 rounded-2xl border border-orchard/15 bg-white px-4 py-3 shadow-soft">
                  <div className="text-left">
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-moss">
                      Kode Invoice
                    </span>
                    <span className="font-mono text-base font-bold text-orchard tabular">
                      {orderResult.orderCode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyCode(orderResult.orderCode)}
                    className="grid size-9 place-items-center rounded-xl bg-cream-2 text-orchard transition hover:bg-gold"
                    aria-label="Salin kode invoice"
                  >
                    {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  </button>
                </div>

                {orderResult.demo ? (
                  <p className="rounded-2xl border border-gold/40 bg-custard/60 p-3 text-xs text-orchard">
                    Mode pratinjau lokal aktif: pesanan langsung dibuatkan format WhatsApp tanpa menulis ke database
                    Supabase.
                  </p>
                ) : null}
              </div>

              <div className="space-y-2.5">
                <a
                  href={orderResult.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gold text-sm font-bold text-orchard shadow-soft transition hover:bg-gold-hover"
                >
                  <MessageCircle className="size-4" />
                  Buka WhatsApp Sekarang
                </a>
                <Button variant="outline" size="md" className="w-full" onClick={() => handleOpenChange(false)}>
                  Kembali Belanja
                </Button>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Dialog>
    </>
  );
}
