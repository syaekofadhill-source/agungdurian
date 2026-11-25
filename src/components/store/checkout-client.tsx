"use client";

import {
  ArrowLeft,
  Check,
  Copy,
  CreditCard,
  MapPin,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Upload,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { RollingNumber } from "@/components/motion/rolling-number";
import { ProductImage } from "@/components/store/product-image";
import { Button } from "@/components/ui/button";
import { Field, FieldError, Input, Textarea } from "@/components/ui/field";
import { submitCheckout } from "@/lib/actions/checkout";
import { BUTIR_PREPARATION_LABEL, DELIVERY_METHOD_META, GRAM_PACKAGING_META } from "@/lib/constants";
import { getButirSize } from "@/lib/pricing";
import { cn, formatGram, formatRupiah } from "@/lib/utils";
import { selectCartCount, selectCartTotal, useCartStore } from "@/stores/cart";
import type { DeliveryMethod, PaymentMethod, StoreSettings } from "@/types/database";

function getInitialPayment(settings: StoreSettings): PaymentMethod {
  if (settings.payment_pickup_enabled) return "ambil_di_tempat";
  if (settings.payment_dana_enabled) return "dana";
  if (settings.payment_cod_enabled) return "cod";
  return "dana";
}

export function CheckoutClient({ settings }: { settings: StoreSettings }) {
  const router = useRouter();
  const lines = useCartStore((s) => s.lines);
  const clear = useCartStore((s) => s.clear);
  const count = useCartStore(selectCartCount);
  const total = useCartStore(selectCartTotal);

  useEffect(() => {
    void useCartStore.persist.rehydrate();
  }, []);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("pickup");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(() => getInitialPayment(settings));
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");

  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [copiedDana, setCopiedDana] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    return () => {
      if (proofPreview) URL.revokeObjectURL(proofPreview);
    };
  }, [proofPreview]);

  function handleDeliverySelect(next: DeliveryMethod) {
    setDeliveryMethod(next);
    if (next === "pickup" && paymentMethod === "cod") {
      setPaymentMethod(settings.payment_pickup_enabled ? "ambil_di_tempat" : "dana");
    } else if (next === "local_delivery" && paymentMethod === "ambil_di_tempat") {
      setPaymentMethod(settings.payment_cod_enabled ? "cod" : "dana");
    } else if (next === "shipping_vacuum" && paymentMethod !== "dana") {
      if (settings.payment_dana_enabled) setPaymentMethod("dana");
    }
  }

  function handlePaymentSelect(next: PaymentMethod) {
    setPaymentMethod(next);
    if (next === "ambil_di_tempat" && deliveryMethod !== "pickup") {
      setDeliveryMethod("pickup");
    } else if (next === "cod" && deliveryMethod === "pickup") {
      setDeliveryMethod("local_delivery");
    }
  }

  function handleProofPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Format bukti harus JPG, PNG, atau WebP.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Ukuran bukti transfer maksimal 3 MB.");
      return;
    }
    if (proofPreview) URL.revokeObjectURL(proofPreview);
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  }

  async function copyDana() {
    try {
      await navigator.clipboard.writeText(settings.payment_dana_number);
      setCopiedDana(true);
      toast.success("Nomor DANA disalin");
      setTimeout(() => setCopiedDana(false), 2000);
    } catch {
      toast.error("Tidak dapat menyalin otomatis");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    startTransition(async () => {
      const res = await submitCheckout({
        customerName,
        customerPhone,
        deliveryMethod,
        paymentMethod,
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
      });

      if (!res.ok || !res.data) {
        setFormError(res.ok ? "Gagal memproses pesanan." : res.error);
        if (!res.ok && res.fieldErrors) setFieldErrors(res.fieldErrors);
        toast.error(res.ok ? "Gagal memproses pesanan." : res.error);
        return;
      }

      let finalPublicOrder = res.data.publicOrder;

      if (paymentMethod === "dana" && proofFile) {
        const fd = new FormData();
        fd.append("orderCode", res.data.orderCode);
        fd.append("file", proofFile);
        try {
          const uploadRes = await fetch("/api/orders/upload-proof", { method: "POST", body: fd });
          const uploadJson = (await uploadRes.json()) as {
            ok: boolean;
            proofUrl?: string;
            order?: typeof finalPublicOrder;
            error?: string;
          };
          if (uploadJson.ok) {
            if (uploadJson.order) {
              finalPublicOrder = uploadJson.order;
            } else if (uploadJson.proofUrl) {
              finalPublicOrder = {
                ...finalPublicOrder,
                payment_proof_url: uploadJson.proofUrl,
                payment_status: "waiting_verification",
              };
            }
          } else if (uploadJson.error) {
            toast.warning(`Pesanan dibuat, tetapi bukti transfer gagal diunggah: ${uploadJson.error}`);
          }
        } catch {
          toast.warning("Pesanan dibuat. Anda dapat mengunggah ulang bukti transfer di halaman invoice.");
        }
      }

      if (res.data.demo) {
        try {
          sessionStorage.setItem(
            `agungdurian-demo-order-${res.data.orderCode}`,
            JSON.stringify(finalPublicOrder),
          );
        } catch {
          // ignore storage quota
        }
      }

      clear();
      toast.success(`Pesanan ${res.data.orderCode} berhasil dibuat!`);
      router.push(`/order/${res.data.orderCode}`);
    });
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <span className="mx-auto grid size-16 place-items-center rounded-3xl bg-cream-2 text-orchard">
          <ShoppingBag className="size-7" />
        </span>
        <h1 className="mt-5 font-display text-3xl font-bold text-orchard">Keranjang belanja masih kosong</h1>
        <p className="mt-2 text-sm text-moss">
          Pilih durian matang pohon per butir atau daging kupas per gram terlebih dahulu sebelum checkout.
        </p>
        <Link
          href="/#katalog"
          className="mt-7 inline-flex h-12 items-center rounded-full bg-gold px-7 text-sm font-bold text-orchard shadow-soft transition hover:bg-gold-hover"
        >
          Jelajahi Katalog Panen
        </Link>
      </div>
    );
  }

  const needsAddress = DELIVERY_METHOD_META[deliveryMethod].needsAddress;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/#katalog" className="inline-flex items-center gap-1.5 text-xs font-semibold text-orchard hover:underline">
            <ArrowLeft className="size-3.5" />
            Tambah durian lain
          </Link>
          <h1 className="mt-2 font-display text-3xl font-bold text-orchard sm:text-4xl">Checkout Pesanan</h1>
          <p className="mt-1 text-sm text-moss">
            Pesanan akan tercatat dengan kode invoice resmi dan menunggu persetujuan admin kebun.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid items-start gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          {formError ? (
            <div role="alert" className="rounded-2xl border border-crimson/25 bg-crimson/10 px-4 py-3 text-xs font-medium text-crimson">
              {formError}
            </div>
          ) : null}

          <section className="space-y-4 rounded-3xl border border-orchard/10 bg-white/85 p-6 shadow-soft">
            <h2 className="font-display text-xl font-bold text-orchard">1. Data Pemesan</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nama Lengkap" htmlFor="chk-name" error={fieldErrors.customerName}>
                <Input
                  id="chk-name"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                />
              </Field>
              <Field
                label="Nomor WhatsApp Aktif"
                htmlFor="chk-phone"
                hint="Dipakai untuk update status & pelacakan."
                error={fieldErrors.customerPhone}
              >
                <Input
                  id="chk-phone"
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0813xxxxxxx"
                />
              </Field>
            </div>
          </section>

          <section className="space-y-4 rounded-3xl border border-orchard/10 bg-white/85 p-6 shadow-soft">
            <h2 className="font-display text-xl font-bold text-orchard">2. Pengambilan / Pengiriman</h2>
            <div className="grid gap-2.5 sm:grid-cols-3">
              {(Object.keys(DELIVERY_METHOD_META) as DeliveryMethod[]).map((method) => {
                const meta = DELIVERY_METHOD_META[method];
                const active = deliveryMethod === method;
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => handleDeliverySelect(method)}
                    className={cn(
                      "rounded-2xl border p-3.5 text-left transition",
                      active
                        ? "border-gold bg-custard/60 ring-1 ring-gold"
                        : "border-orchard/12 bg-cream/60 hover:border-orchard/30",
                    )}
                  >
                    <span className="block text-sm font-bold text-orchard">{meta.label}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-moss">{meta.hint}</span>
                  </button>
                );
              })}
            </div>
            <FieldError messages={fieldErrors.deliveryMethod} />

            {needsAddress ? (
              <Field label="Alamat Pengiriman Lengkap" htmlFor="chk-addr" error={fieldErrors.deliveryAddress}>
                <Textarea
                  id="chk-addr"
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Jalan, nomor rumah, RT/RW, kecamatan, kota, patokan…"
                />
              </Field>
            ) : (
              <div className="flex items-start gap-2.5 rounded-2xl border border-orchard/10 bg-cream-2/60 p-3.5 text-xs text-orchard">
                <MapPin className="mt-0.5 size-4 shrink-0 text-gold-hover" />
                <div>
                  <p className="font-semibold">Lokasi Pengambilan Kebun</p>
                  <p className="mt-0.5 text-moss">{settings.address}</p>
                </div>
              </div>
            )}

            <Field label="Catatan untuk Pak Agung (Opsional)" htmlFor="chk-notes" error={fieldErrors.notes}>
              <Textarea
                id="chk-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Pilih yang agak pahit, ambil sekitar jam 15.00 WIB…"
                className="min-h-18"
              />
            </Field>
          </section>

          <section className="space-y-4 rounded-3xl border border-orchard/10 bg-white/85 p-6 shadow-soft">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-xl font-bold text-orchard">3. Metode Pembayaran</h2>
              <span className="text-xs text-moss">Dikonfirmasi admin saat approval</span>
            </div>

            <div className="grid gap-3">
              {settings.payment_dana_enabled ? (
                <div
                  className={cn(
                    "rounded-2xl border p-4 transition",
                    paymentMethod === "dana" ? "border-gold bg-custard/35 ring-1 ring-gold" : "border-orchard/12 bg-cream/50",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => handlePaymentSelect("dana")}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-xl bg-sky-600/12 text-sky-900">
                        <Wallet className="size-5" />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-orchard">Transfer DANA</p>
                        <p className="text-xs text-moss">Transfer &amp; unggah bukti langsung atau di halaman invoice</p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "size-5 rounded-full border-2",
                        paymentMethod === "dana" ? "border-orchard bg-gold" : "border-orchard/25",
                      )}
                    />
                  </button>

                  {paymentMethod === "dana" ? (
                    <div className="mt-4 space-y-4 border-t border-orchard/10 pt-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-orchard/10 bg-white p-3.5">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-moss">
                            Nomor DANA Tujuan ({settings.payment_dana_holder})
                          </p>
                          <p className="mt-0.5 font-mono text-lg font-bold text-orchard tabular">
                            {settings.payment_dana_number}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={copyDana}
                          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-cream-2 px-3.5 text-xs font-semibold text-orchard hover:bg-gold"
                        >
                          {copiedDana ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                          {copiedDana ? "Tersalin" : "Salin Nomor"}
                        </button>
                      </div>

                      {settings.dana_qr_image_url ? (
                        <div className="flex items-center gap-4 rounded-2xl border border-orchard/10 bg-white p-3.5">
                          <div className="relative size-24 shrink-0 overflow-hidden rounded-xl border border-orchard/10 bg-cream">
                            <ProductImage src={settings.dana_qr_image_url} alt="QR DANA AgungDurian" fill sizes="96px" />
                          </div>
                          <p className="text-xs leading-relaxed text-moss">
                            Scan kode QR DANA ini, lalu unggah screenshot bukti pembayaran di bawah ini.
                          </p>
                        </div>
                      ) : null}

                      <p className="text-xs leading-relaxed text-moss">{settings.payment_dana_instructions}</p>

                      <div className="rounded-2xl border border-dashed border-orchard/25 bg-white/80 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-orchard">Bukti Transfer DANA (Opsional saat checkout)</p>
                            <p className="text-[11px] text-moss">
                              Bisa langsung unggah sekarang atau menyusul di halaman invoice. Maks 3 MB (JPG/PNG/WebP).
                            </p>
                          </div>
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-orchard px-4 py-2 text-xs font-semibold text-cream hover:bg-orchard-2">
                            <Upload className="size-3.5 text-gold" />
                            <span>{proofFile ? "Ganti Bukti" : "Pilih Foto Bukti"}</span>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={handleProofPick}
                              className="sr-only"
                            />
                          </label>
                        </div>
                        {proofPreview ? (
                          <div className="mt-3 flex items-center gap-3 rounded-xl bg-cream-2/70 p-2.5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={proofPreview} alt="Preview bukti DANA" className="size-14 rounded-lg object-cover" />
                            <div className="min-w-0 flex-1 text-xs">
                              <p className="truncate font-semibold text-orchard">{proofFile?.name}</p>
                              <button
                                type="button"
                                onClick={() => {
                                  if (proofPreview) URL.revokeObjectURL(proofPreview);
                                  setProofFile(null);
                                  setProofPreview(null);
                                }}
                                className="text-[11px] font-semibold text-crimson hover:underline"
                              >
                                Hapus file
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {settings.payment_cod_enabled ? (
                <button
                  type="button"
                  onClick={() => handlePaymentSelect("cod")}
                  className={cn(
                    "flex items-center justify-between rounded-2xl border p-4 text-left transition",
                    paymentMethod === "cod"
                      ? "border-gold bg-custard/35 ring-1 ring-gold"
                      : "border-orchard/12 bg-cream/50 hover:border-orchard/30",
                  )}
                >
                  <div className="flex items-center gap-3 pr-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-600/12 text-[#8a5f00]">
                      <Truck className="size-5" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-orchard">COD (Bayar di Tempat saat Kurir Tiba)</p>
                      <p className="text-xs text-moss">{settings.payment_cod_notes}</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "size-5 shrink-0 rounded-full border-2",
                      paymentMethod === "cod" ? "border-orchard bg-gold" : "border-orchard/25",
                    )}
                  />
                </button>
              ) : null}

              {settings.payment_pickup_enabled ? (
                <button
                  type="button"
                  onClick={() => handlePaymentSelect("ambil_di_tempat")}
                  className={cn(
                    "flex items-center justify-between rounded-2xl border p-4 text-left transition",
                    paymentMethod === "ambil_di_tempat"
                      ? "border-gold bg-custard/35 ring-1 ring-gold"
                      : "border-orchard/12 bg-cream/50 hover:border-orchard/30",
                  )}
                >
                  <div className="flex items-center gap-3 pr-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-orchard/10 text-orchard">
                      <PackageCheck className="size-5" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-orchard">Bayar &amp; Ambil Langsung di Kebun</p>
                      <p className="text-xs text-moss">{settings.payment_pickup_notes}</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "size-5 shrink-0 rounded-full border-2",
                      paymentMethod === "ambil_di_tempat" ? "border-orchard bg-gold" : "border-orchard/25",
                    )}
                  />
                </button>
              ) : null}
            </div>
            <FieldError messages={fieldErrors.paymentMethod} />
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:col-span-5">
          <div className="rounded-3xl border border-orchard/10 bg-white/90 p-6 shadow-lift">
            <h2 className="font-display text-xl font-bold text-orchard">Ringkasan Pesanan ({count} item)</h2>
            <ul className="mt-4 divide-y divide-orchard/10">
              {lines.map((line) => (
                <li key={line.key} className="flex items-center gap-3 py-3.5">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-orchard">
                    <ProductImage src={line.imageUrl} alt={line.name} fill sizes="56px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-bold text-orchard">{line.name}</p>
                    <p className="text-xs text-moss">
                      {line.mode === "butir"
                        ? `${line.quantity}× ${getButirSize(line.size).label} · ${BUTIR_PREPARATION_LABEL[line.preparation]}`
                        : `${line.quantity}× ${formatGram(line.grams)} · ${GRAM_PACKAGING_META[line.packaging].label}`}
                    </p>
                  </div>
                  <span className="font-mono text-sm font-bold text-orchard tabular">
                    {formatRupiah(line.unitPrice * line.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-4 space-y-2 border-t border-orchard/10 pt-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium text-moss">Subtotal Pesanan</span>
                <RollingNumber value={total} prefix="Rp" className="text-2xl font-bold text-orchard" />
              </div>
              {deliveryMethod !== "pickup" ? (
                <p className="text-xs text-moss">Ongkir antar/ekspedisi vacuum dikonfirmasi admin saat approval.</p>
              ) : null}
            </div>

            <Button type="submit" variant="gold" size="lg" className="mt-5 w-full" disabled={pending}>
              <CreditCard className="size-4" />
              {pending ? "Memproses Pesanan…" : "Buat Pesanan & Buka Invoice"}
            </Button>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-[11.5px] text-moss">
              <ShieldCheck className="size-4 text-orchard" />
              Garansi ganti baru jika durian hambar atau mengkal.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
