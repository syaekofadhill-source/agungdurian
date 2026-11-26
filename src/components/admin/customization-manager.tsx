"use client";

import {
  Boxes,
  MapPin,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Tag,
  Ticket,
  Trash2,
} from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  deleteCustomOption,
  deleteDeliveryZone,
  deletePromoVoucher,
  saveCustomOption,
  saveDeliveryZone,
  saveGramPresets,
  savePromoVoucher,
  toggleCustomOption,
  toggleDeliveryZone,
  togglePromoVoucher,
} from "@/lib/actions/customization";
import { formatGram, formatRupiah, slugify } from "@/lib/utils";
import type {
  CustomOption,
  CustomOptionType,
  DeliveryZone,
  PromoVoucher,
} from "@/types/database";

type CustomOptionScope = CustomOption["applies_to"];

interface CustomizationManagerProps {
  options: CustomOption[];
  zones: DeliveryZone[];
  vouchers: PromoVoucher[];
  gramPresets: number[];
  configured: boolean;
}

type DeleteTarget =
  | { kind: "option"; id: string; label: string }
  | { kind: "zone"; id: string; label: string }
  | { kind: "voucher"; id: string; label: string };

const SCOPE_LABELS: Record<CustomOptionScope, string> = {
  butir: "Per Butir",
  gram: "Per Gram",
  both: "Butir & Gram",
  order: "Checkout",
};

function OptionModalBody({
  optionType,
  editing,
  configured,
  onClose,
}: {
  optionType: CustomOptionType;
  editing: CustomOption | null;
  configured: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [code, setCode] = useState(editing?.code ?? "");
  const [codeEdited, setCodeEdited] = useState(Boolean(editing));
  const [description, setDescription] = useState(editing?.description ?? "");
  const [appliesTo, setAppliesTo] = useState<CustomOptionScope>(
    editing?.applies_to ??
      (optionType === "checkout_addon"
        ? "order"
        : optionType === "preparation" || optionType === "butir_grade"
          ? "butir"
          : "both"),
  );
  const [extraPrice, setExtraPrice] = useState(String(editing?.extra_price ?? 0));
  const [priceMultiplier, setPriceMultiplier] = useState(String(editing?.price_multiplier ?? 1));
  const [weightLabel, setWeightLabel] = useState(editing?.weight_label ?? "");
  const [badge, setBadge] = useState(editing?.badge ?? "");
  const [sortOrder, setSortOrder] = useState(String(editing?.sort_order ?? 10));
  const [isDefault, setIsDefault] = useState(editing?.is_default ?? false);
  const [isActive, setIsActive] = useState(editing?.is_active ?? true);
  const [pending, startTransition] = useTransition();

  function handleNameChange(val: string) {
    setName(val);
    if (!codeEdited) setCode(slugify(val));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) {
      toast.info("Mode pratinjau: hubungkan Supabase di .env.local untuk menyimpan perubahan.");
      return;
    }
    startTransition(async () => {
      const res = await saveCustomOption(
        {
          option_type: optionType,
          code,
          name,
          description,
          applies_to: appliesTo,
          extra_price: Number(extraPrice) || 0,
          price_multiplier: Number(priceMultiplier) || 1,
          weight_label: weightLabel.trim() ? weightLabel.trim() : null,
          badge: badge.trim() ? badge.trim() : null,
          is_default: isDefault,
          is_active: isActive,
          sort_order: Number(sortOrder) || 0,
        },
        editing?.id,
      );
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message ?? "Opsi tersimpan.");
      onClose();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nama Opsi" htmlFor="opt-name">
          <Input id="opt-name" required value={name} onChange={(e) => handleNameChange(e.target.value)} />
        </Field>
        <Field label="Kode Unik (slug)" htmlFor="opt-code">
          <Input
            id="opt-code"
            required
            value={code}
            onChange={(e) => {
              setCodeEdited(true);
              setCode(e.target.value.toLowerCase());
            }}
            className="font-mono text-xs"
            placeholder="box-hadiah-premium"
          />
        </Field>
      </div>

      <Field label="Deskripsi Singkat" htmlFor="opt-desc">
        <Textarea
          id="opt-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-16"
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-3">
        {optionType === "packing" ? (
          <Field label="Berlaku Untuk" htmlFor="opt-scope">
            <Select id="opt-scope" value={appliesTo} onChange={(e) => setAppliesTo(e.target.value as CustomOptionScope)}>
              <option value="both">Butir &amp; Gram</option>
              <option value="butir">Per Butir Saja</option>
              <option value="gram">Per Gram Saja</option>
            </Select>
          </Field>
        ) : null}

        {optionType !== "category" ? (
          <Field label="Biaya Tambahan (Rp)" htmlFor="opt-price">
            <Input
              id="opt-price"
              type="number"
              min={0}
              value={extraPrice}
              onChange={(e) => setExtraPrice(e.target.value)}
              className="font-mono"
            />
          </Field>
        ) : null}

        {optionType === "butir_grade" ? (
          <>
            <Field label="Pengali Harga (cth: 1.3)" htmlFor="opt-mult">
              <Input
                id="opt-mult"
                type="number"
                step="0.05"
                min={0.1}
                max={10}
                value={priceMultiplier}
                onChange={(e) => setPriceMultiplier(e.target.value)}
                className="font-mono"
              />
            </Field>
            <Field label="Label Bobot (cth: 2.0-2.8 kg)" htmlFor="opt-weight">
              <Input id="opt-weight" value={weightLabel} onChange={(e) => setWeightLabel(e.target.value)} />
            </Field>
          </>
        ) : null}

        <Field label="Badge (Opsional)" htmlFor="opt-badge">
          <Input id="opt-badge" value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="Populer / Hemat" />
        </Field>

        <Field label="Urutan Tampil" htmlFor="opt-sort">
          <Input
            id="opt-sort"
            type="number"
            min={0}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="font-mono"
          />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-orchard/10 bg-cream-2/50 px-4 py-3 text-xs">
        <label className="flex items-center gap-2 font-semibold text-orchard">
          <Switch checked={isActive} onCheckedChange={setIsActive} />
          Aktif di Toko
        </label>
        {optionType !== "category" && optionType !== "checkout_addon" ? (
          <label className="flex items-center gap-2 font-semibold text-orchard">
            <Switch checked={isDefault} onCheckedChange={setIsDefault} />
            Pilihan Default
          </label>
        ) : null}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <DialogClose className="inline-flex h-10 items-center rounded-full border border-orchard/15 px-4 text-xs font-semibold">
          Batal
        </DialogClose>
        <Button type="submit" variant="gold" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan Opsi"}
        </Button>
      </div>
    </form>
  );
}

function ZoneModalBody({
  editing,
  configured,
  onClose,
}: {
  editing: DeliveryZone | null;
  configured: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [shippingFee, setShippingFee] = useState(String(editing?.shipping_fee ?? 0));
  const [estimatedTime, setEstimatedTime] = useState(editing?.estimated_time ?? "");
  const [allowCod, setAllowCod] = useState(editing?.allow_cod ?? true);
  const [isActive, setIsActive] = useState(editing?.is_active ?? true);
  const [sortOrder, setSortOrder] = useState(String(editing?.sort_order ?? 10));
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) {
      toast.info("Mode pratinjau: hubungkan Supabase di .env.local untuk menyimpan perubahan.");
      return;
    }
    startTransition(async () => {
      const res = await saveDeliveryZone(
        {
          name,
          description,
          shipping_fee: Number(shippingFee) || 0,
          estimated_time: estimatedTime,
          allow_cod: allowCod,
          is_active: isActive,
          sort_order: Number(sortOrder) || 0,
        },
        editing?.id,
      );
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message ?? "Zona ongkir tersimpan.");
      onClose();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <Field label="Nama Zona Pengiriman" htmlFor="zn-name">
        <Input id="zn-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Banjarnegara Kota" />
      </Field>
      <Field label="Cakupan Area / Keterangan" htmlFor="zn-desc">
        <Textarea id="zn-desc" value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-16" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Ongkir (Rp)" htmlFor="zn-fee">
          <Input
            id="zn-fee"
            type="number"
            min={0}
            value={shippingFee}
            onChange={(e) => setShippingFee(e.target.value)}
            className="font-mono"
          />
        </Field>
        <Field label="Estimasi Tiba" htmlFor="zn-eta">
          <Input id="zn-eta" value={estimatedTime} onChange={(e) => setEstimatedTime(e.target.value)} placeholder="1–2 jam" />
        </Field>
        <Field label="Urutan" htmlFor="zn-sort">
          <Input
            id="zn-sort"
            type="number"
            min={0}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="font-mono"
          />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-orchard/10 bg-cream-2/50 px-4 py-3 text-xs">
        <label className="flex items-center gap-2 font-semibold text-orchard">
          <Switch checked={allowCod} onCheckedChange={setAllowCod} />
          Izinkan COD di Zona Ini
        </label>
        <label className="flex items-center gap-2 font-semibold text-orchard">
          <Switch checked={isActive} onCheckedChange={setIsActive} />
          Zona Aktif
        </label>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <DialogClose className="inline-flex h-10 items-center rounded-full border border-orchard/15 px-4 text-xs font-semibold">
          Batal
        </DialogClose>
        <Button type="submit" variant="gold" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan Zona"}
        </Button>
      </div>
    </form>
  );
}

function VoucherModalBody({
  editing,
  configured,
  onClose,
}: {
  editing: PromoVoucher | null;
  configured: boolean;
  onClose: () => void;
}) {
  const [code, setCode] = useState(editing?.code ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">(editing?.discount_type ?? "percent");
  const [discountValue, setDiscountValue] = useState(String(editing?.discount_value ?? 10));
  const [maxDiscount, setMaxDiscount] = useState(editing?.max_discount ? String(editing.max_discount) : "");
  const [minSubtotal, setMinSubtotal] = useState(String(editing?.min_subtotal ?? 0));
  const [usageLimit, setUsageLimit] = useState(editing?.usage_limit ? String(editing.usage_limit) : "");
  const [isActive, setIsActive] = useState(editing?.is_active ?? true);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) {
      toast.info("Mode pratinjau: hubungkan Supabase di .env.local untuk menyimpan perubahan.");
      return;
    }
    startTransition(async () => {
      const res = await savePromoVoucher(
        {
          code: code.toUpperCase(),
          description,
          discount_type: discountType,
          discount_value: Number(discountValue) || 1,
          max_discount: maxDiscount.trim() ? Number(maxDiscount) : null,
          min_subtotal: Number(minSubtotal) || 0,
          usage_limit: usageLimit.trim() ? Number(usageLimit) : null,
          is_active: isActive,
          expires_at: editing?.expires_at ?? null,
        },
        editing?.id,
      );
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message ?? "Voucher tersimpan.");
      onClose();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Kode Voucher" htmlFor="vc-code">
          <Input
            id="vc-code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="font-mono uppercase"
            placeholder="PANEN10"
          />
        </Field>
        <Field label="Tipe Diskon" htmlFor="vc-type">
          <Select id="vc-type" value={discountType} onChange={(e) => setDiscountType(e.target.value as "percent" | "fixed")}>
            <option value="percent">Persentase (%)</option>
            <option value="fixed">Potongan Tetap (Rp)</option>
          </Select>
        </Field>
      </div>

      <Field label="Deskripsi Promo" htmlFor="vc-desc">
        <Input id="vc-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Diskon 10% panen perdana" />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={discountType === "percent" ? "Persen Diskon (%)" : "Nominal Diskon (Rp)"} htmlFor="vc-val">
          <Input
            id="vc-val"
            type="number"
            min={1}
            max={discountType === "percent" ? 100 : 50_000_000}
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            className="font-mono"
          />
        </Field>
        <Field label="Maksimal Potongan Rp (Opsional)" htmlFor="vc-max">
          <Input
            id="vc-max"
            type="number"
            min={1}
            value={maxDiscount}
            onChange={(e) => setMaxDiscount(e.target.value)}
            placeholder="Kosongkan jika tanpa batas"
            className="font-mono"
          />
        </Field>
        <Field label="Minimal Belanja (Rp)" htmlFor="vc-min">
          <Input
            id="vc-min"
            type="number"
            min={0}
            value={minSubtotal}
            onChange={(e) => setMinSubtotal(e.target.value)}
            className="font-mono"
          />
        </Field>
        <Field label="Kuota Pemakaian (Opsional)" htmlFor="vc-limit">
          <Input
            id="vc-limit"
            type="number"
            min={1}
            value={usageLimit}
            onChange={(e) => setUsageLimit(e.target.value)}
            placeholder="Tanpa batas"
            className="font-mono"
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 rounded-2xl border border-orchard/10 bg-cream-2/50 px-4 py-3 text-xs font-semibold text-orchard">
        <Switch checked={isActive} onCheckedChange={setIsActive} />
        Voucher Aktif
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <DialogClose className="inline-flex h-10 items-center rounded-full border border-orchard/15 px-4 text-xs font-semibold">
          Batal
        </DialogClose>
        <Button type="submit" variant="gold" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan Voucher"}
        </Button>
      </div>
    </form>
  );
}

export function CustomizationManager({
  options,
  zones,
  vouchers,
  gramPresets,
  configured,
}: CustomizationManagerProps) {
  const [tab, setTab] = useState("packing");
  const [optionModal, setOptionModal] = useState<{ type: CustomOptionType; editing: CustomOption | null } | null>(null);
  const [zoneModal, setZoneModal] = useState<{ open: boolean; editing: DeliveryZone | null }>({ open: false, editing: null });
  const [voucherModal, setVoucherModal] = useState<{ open: boolean; editing: PromoVoucher | null }>({ open: false, editing: null });
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [presetDraft, setPresetDraft] = useState(() => gramPresets.join(", "));
  const [pending, startTransition] = useTransition();

  const byType = (t: CustomOptionType) => options.filter((o) => o.option_type === t);

  function guardDemo(): boolean {
    if (!configured) {
      toast.info("Mode pratinjau: hubungkan Supabase di .env.local untuk mengubah kustomisasi.");
      return true;
    }
    return false;
  }

  function handleToggleOption(opt: CustomOption, next: boolean) {
    if (guardDemo()) return;
    startTransition(async () => {
      const res = await toggleCustomOption(opt.id, next);
      if (!res.ok) toast.error(res.error);
    });
  }

  function handleToggleZone(zone: DeliveryZone, next: boolean) {
    if (guardDemo()) return;
    startTransition(async () => {
      const res = await toggleDeliveryZone(zone.id, next);
      if (!res.ok) toast.error(res.error);
    });
  }

  function handleToggleVoucher(v: PromoVoucher, next: boolean) {
    if (guardDemo()) return;
    startTransition(async () => {
      const res = await togglePromoVoucher(v.id, next);
      if (!res.ok) toast.error(res.error);
    });
  }

  function handleSavePresets(e: React.FormEvent) {
    e.preventDefault();
    if (guardDemo()) return;
    const nums = presetDraft
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n >= 100);
    if (nums.length === 0) {
      toast.error("Masukkan minimal 1 angka gramasi valid (min 100g), pisahkan dengan koma.");
      return;
    }
    startTransition(async () => {
      const res = await saveGramPresets(nums);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message ?? "Preset gramasi tersimpan.");
    });
  }

  function handleConfirmDelete() {
    if (!deleteTarget || guardDemo()) return;
    const target = deleteTarget;
    startTransition(async () => {
      const res =
        target.kind === "option"
          ? await deleteCustomOption(target.id)
          : target.kind === "zone"
            ? await deleteDeliveryZone(target.id)
            : await deletePromoVoucher(target.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message ?? "Data dihapus.");
      setDeleteTarget(null);
    });
  }

  function renderOptionList(type: CustomOptionType, emptyText: string) {
    const list = byType(type);
    if (list.length === 0) {
      return <p className="rounded-2xl border border-dashed border-orchard/15 p-8 text-center text-xs text-moss">{emptyText}</p>;
    }
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {list.map((opt) => (
          <div
            key={opt.id}
            className="flex items-start justify-between gap-3 rounded-2xl border border-orchard/10 bg-white/90 p-4 shadow-soft"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-display text-base font-bold text-orchard">{opt.name}</span>
                <span className="rounded-full bg-cream-2 px-2 py-0.5 font-mono text-[10px] text-moss">{opt.code}</span>
                {opt.badge ? (
                  <span className="rounded-full bg-custard px-2 py-0.5 text-[10px] font-bold text-orchard">{opt.badge}</span>
                ) : null}
                {opt.is_default ? (
                  <span className="rounded-full bg-emerald-700/10 px-2 py-0.5 text-[10px] font-bold text-emerald-800">Default</span>
                ) : null}
              </div>
              {opt.description ? <p className="text-xs text-moss">{opt.description}</p> : null}
              <div className="flex flex-wrap gap-3 pt-1 text-[11px] font-semibold text-orchard">
                <span>Lingkup: {SCOPE_LABELS[opt.applies_to]}</span>
                {opt.extra_price > 0 ? <span className="font-mono">+{formatRupiah(opt.extra_price)}</span> : <span>Gratis</span>}
                {opt.option_type === "butir_grade" ? (
                  <span className="font-mono">
                    ×{opt.price_multiplier} {opt.weight_label ? `(${opt.weight_label})` : ""}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Switch checked={opt.is_active} disabled={pending} onCheckedChange={(v) => handleToggleOption(opt, v)} />
              <button
                type="button"
                onClick={() => setOptionModal({ type, editing: opt })}
                className="grid size-8 place-items-center rounded-full border border-orchard/15 bg-white text-orchard hover:bg-cream-2"
                aria-label={`Edit ${opt.name}`}
              >
                <Pencil className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget({ kind: "option", id: opt.id, label: opt.name })}
                className="grid size-8 place-items-center rounded-full border border-orchard/15 bg-white text-moss hover:border-crimson/40 hover:bg-crimson/10 hover:text-crimson"
                aria-label={`Hapus ${opt.name}`}
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-hover">Mesin Kustomisasi Toko</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-orchard">Opsi Packing, Ongkir &amp; Promo</h1>
        <p className="mt-1 text-sm text-moss">
          Semua opsi di bawah ini langsung tampil di kalkulator produk &amp; checkout dan dihitung aman di server.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex h-auto flex-wrap justify-start gap-1.5 rounded-2xl bg-cream-2/80 p-1.5">
          <TabsTrigger value="packing" className="gap-1.5">
            <Boxes className="size-3.5" />
            Custom Packing
          </TabsTrigger>
          <TabsTrigger value="penyajian" className="gap-1.5">
            <Sparkles className="size-3.5" />
            Penyajian &amp; Grade Butir
          </TabsTrigger>
          <TabsTrigger value="kategori" className="gap-1.5">
            <Tag className="size-3.5" />
            Kategori &amp; Preset Gramasi
          </TabsTrigger>
          <TabsTrigger value="ongkir" className="gap-1.5">
            <MapPin className="size-3.5" />
            Zona Ongkir &amp; Add-on
          </TabsTrigger>
          <TabsTrigger value="voucher" className="gap-1.5">
            <Ticket className="size-3.5" />
            Kode Promo / Voucher
          </TabsTrigger>
        </TabsList>

        <TabsContent value="packing" className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-orchard">Opsi Kemasan / Packing</h2>
              <p className="text-xs text-moss">Contoh: Box Thinwall, Vacuum Seal, Besek Bambu, atau Box Hadiah Pita.</p>
            </div>
            <Button variant="gold" size="sm" onClick={() => setOptionModal({ type: "packing", editing: null })}>
              <Plus className="size-4" />
              Tambah Packing
            </Button>
          </div>
          {renderOptionList("packing", "Belum ada opsi packing kustom.")}
        </TabsContent>

        <TabsContent value="penyajian" className="mt-5 space-y-8">
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold text-orchard">Opsi Penyajian (Mode Per Butir)</h2>
                <p className="text-xs text-moss">Misal: Utuh Belum Dibuka, Belah di Tempat, atau Kupas ke Box.</p>
              </div>
              <Button variant="gold" size="sm" onClick={() => setOptionModal({ type: "preparation", editing: null })}>
                <Plus className="size-4" />
                Tambah Penyajian
              </Button>
            </div>
            {renderOptionList("preparation", "Belum ada opsi penyajian.")}
          </section>

          <section className="space-y-4 border-t border-orchard/10 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold text-orchard">Grade / Ukuran Butir</h2>
                <p className="text-xs text-moss">Atur pengali harga (multiplier) dan estimasi bobot tiap grade ukuran.</p>
              </div>
              <Button variant="gold" size="sm" onClick={() => setOptionModal({ type: "butir_grade", editing: null })}>
                <Plus className="size-4" />
                Tambah Grade Butir
              </Button>
            </div>
            {renderOptionList("butir_grade", "Belum ada grade butir.")}
          </section>
        </TabsContent>

        <TabsContent value="kategori" className="mt-5 space-y-8">
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold text-orchard">Kategori Varietas Produk</h2>
                <p className="text-xs text-moss">Kategori baru otomatis tersedia di tab filter katalog &amp; form tambah produk.</p>
              </div>
              <Button variant="gold" size="sm" onClick={() => setOptionModal({ type: "category", editing: null })}>
                <Plus className="size-4" />
                Tambah Kategori
              </Button>
            </div>
            {renderOptionList("category", "Belum ada kategori.")}
          </section>

          <section className="rounded-3xl border border-orchard/10 bg-white/85 p-6 shadow-soft">
            <h2 className="font-display text-xl font-bold text-orchard">Preset Tombol Cepat Gramasi</h2>
            <p className="mt-1 text-xs text-moss">
              Pisahkan angka dalam gram dengan koma. Contoh: <span className="font-mono">250, 500, 1000, 1500</span>
            </p>
            <form onSubmit={handleSavePresets} className="mt-4 flex flex-wrap items-end gap-3">
              <div className="min-w-64 flex-1">
                <Input value={presetDraft} onChange={(e) => setPresetDraft(e.target.value)} className="font-mono" />
              </div>
              <Button type="submit" variant="gold" disabled={pending}>
                <Save className="size-4" />
                Simpan Preset
              </Button>
            </form>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {gramPresets.map((g) => (
                <span key={g} className="rounded-full bg-cream-2 px-3 py-1 font-mono text-xs font-semibold text-orchard">
                  {formatGram(g)}
                </span>
              ))}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="ongkir" className="mt-5 space-y-8">
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold text-orchard">Zona Ongkir Pengiriman</h2>
                <p className="text-xs text-moss">Atur tarif ongkir per wilayah, estimasi waktu, dan ketersediaan COD.</p>
              </div>
              <Button variant="gold" size="sm" onClick={() => setZoneModal({ open: true, editing: null })}>
                <Plus className="size-4" />
                Tambah Zona Ongkir
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-orchard/10 bg-white/90 p-4 shadow-soft"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-base font-bold text-orchard">{zone.name}</span>
                      <span className="rounded-full bg-custard px-2.5 py-0.5 font-mono text-xs font-bold text-orchard tabular">
                        {zone.shipping_fee === 0 ? "Gratis" : formatRupiah(zone.shipping_fee)}
                      </span>
                    </div>
                    {zone.description ? <p className="text-xs text-moss">{zone.description}</p> : null}
                    <p className="text-[11px] font-semibold text-orchard">
                      {zone.estimated_time || "Estimasi fleksibel"} · {zone.allow_cod ? "COD Tersedia" : "Non-COD"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Switch checked={zone.is_active} disabled={pending} onCheckedChange={(v) => handleToggleZone(zone, v)} />
                    <button
                      type="button"
                      onClick={() => setZoneModal({ open: true, editing: zone })}
                      className="grid size-8 place-items-center rounded-full border border-orchard/15 bg-white text-orchard hover:bg-cream-2"
                      aria-label={`Edit ${zone.name}`}
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget({ kind: "zone", id: zone.id, label: zone.name })}
                      className="grid size-8 place-items-center rounded-full border border-orchard/15 bg-white text-moss hover:border-crimson/40 hover:bg-crimson/10 hover:text-crimson"
                      aria-label={`Hapus ${zone.name}`}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4 border-t border-orchard/10 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold text-orchard">Add-on Tambahan Checkout</h2>
                <p className="text-xs text-moss">Misal: Kartu Ucapan Premium, Extra Ice Gel, atau Tas Thermal.</p>
              </div>
              <Button variant="gold" size="sm" onClick={() => setOptionModal({ type: "checkout_addon", editing: null })}>
                <Plus className="size-4" />
                Tambah Add-on
              </Button>
            </div>
            {renderOptionList("checkout_addon", "Belum ada add-on checkout.")}
          </section>
        </TabsContent>

        <TabsContent value="voucher" className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-orchard">Kode Promo &amp; Voucher</h2>
              <p className="text-xs text-moss">Divalidasi dan dipotong otomatis di server saat pelanggan checkout.</p>
            </div>
            <Button variant="gold" size="sm" onClick={() => setVoucherModal({ open: true, editing: null })}>
              <Plus className="size-4" />
              Buat Voucher
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {vouchers.map((v) => (
              <div
                key={v.id}
                className="flex items-start justify-between gap-3 rounded-2xl border border-orchard/10 bg-white/90 p-4 shadow-soft"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-orchard px-2.5 py-0.5 font-mono text-sm font-bold text-gold">{v.code}</span>
                    <span className="font-mono text-xs font-bold text-orchard">
                      {v.discount_type === "percent" ? `Diskon ${v.discount_value}%` : `Potongan ${formatRupiah(v.discount_value)}`}
                    </span>
                  </div>
                  {v.description ? <p className="text-xs text-moss">{v.description}</p> : null}
                  <p className="text-[11px] font-semibold text-orchard">
                    Min. {formatRupiah(v.min_subtotal)}
                    {v.max_discount ? ` · Maks ${formatRupiah(v.max_discount)}` : ""}
                    {` · Terpakai ${v.used_count}${v.usage_limit ? `/${v.usage_limit}` : ""}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Switch checked={v.is_active} disabled={pending} onCheckedChange={(next) => handleToggleVoucher(v, next)} />
                  <button
                    type="button"
                    onClick={() => setVoucherModal({ open: true, editing: v })}
                    className="grid size-8 place-items-center rounded-full border border-orchard/15 bg-white text-orchard hover:bg-cream-2"
                    aria-label={`Edit ${v.code}`}
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget({ kind: "voucher", id: v.id, label: v.code })}
                    className="grid size-8 place-items-center rounded-full border border-orchard/15 bg-white text-moss hover:border-crimson/40 hover:bg-crimson/10 hover:text-crimson"
                    aria-label={`Hapus ${v.code}`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={optionModal !== null} onOpenChange={(o) => { if (!o) setOptionModal(null); }}>
        <DialogContent className="max-w-lg p-6">
          <DialogTitle className="font-display text-xl font-bold text-orchard">
            {optionModal?.editing ? `Edit ${optionModal.editing.name}` : "Tambah Opsi Kustom"}
          </DialogTitle>
          <DialogDescription className="text-xs text-moss">
            Perubahan akan langsung aktif pada etalase toko dan checkout.
          </DialogDescription>
          {optionModal ? (
            <OptionModalBody
              key={optionModal.editing?.id ?? `new-${optionModal.type}`}
              optionType={optionModal.type}
              editing={optionModal.editing}
              configured={configured}
              onClose={() => setOptionModal(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={zoneModal.open} onOpenChange={(o) => { if (!o) setZoneModal({ open: false, editing: null }); }}>
        <DialogContent className="max-w-lg p-6">
          <DialogTitle className="font-display text-xl font-bold text-orchard">
            {zoneModal.editing ? `Edit Zona ${zoneModal.editing.name}` : "Tambah Zona Ongkir"}
          </DialogTitle>
          <DialogDescription className="text-xs text-moss">
            Atur tarif ongkos kirim dan ketersediaan COD per wilayah.
          </DialogDescription>
          {zoneModal.open ? (
            <ZoneModalBody
              key={zoneModal.editing?.id ?? "new-zone"}
              editing={zoneModal.editing}
              configured={configured}
              onClose={() => setZoneModal({ open: false, editing: null })}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={voucherModal.open} onOpenChange={(o) => { if (!o) setVoucherModal({ open: false, editing: null }); }}>
        <DialogContent className="max-w-lg p-6">
          <DialogTitle className="font-display text-xl font-bold text-orchard">
            {voucherModal.editing ? `Edit Voucher ${voucherModal.editing.code}` : "Buat Kode Voucher"}
          </DialogTitle>
          <DialogDescription className="text-xs text-moss">
            Pelanggan dapat memasukkan kode ini di halaman checkout.
          </DialogDescription>
          {voucherModal.open ? (
            <VoucherModalBody
              key={voucherModal.editing?.id ?? "new-voucher"}
              editing={voucherModal.editing}
              configured={configured}
              onClose={() => setVoucherModal({ open: false, editing: null })}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Hapus Item Kustomisasi?"
        description={`Anda yakin ingin menghapus "${deleteTarget?.label ?? ""}"? Data pesanan lama tetap aman karena snapshot tersimpan di riwayat order.`}
        confirmLabel="Ya, Hapus"
        confirmVariant="danger"
        pending={pending}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
