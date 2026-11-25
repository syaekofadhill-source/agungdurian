"use client";

import { RotateCcw, Upload } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";

import { ProductImage } from "@/components/store/product-image";
import { Field, FieldError, Input } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type UploadFolder = "products" | "hero" | "branding" | "sections" | "payment";

export function ImageUploadCard({
  title,
  description,
  value,
  onChange,
  folder,
  assetName,
  defaultValue,
  aspectClass = "aspect-[16/10]",
  configured,
  error,
}: {
  title: string;
  description: string;
  value: string;
  onChange: (next: string) => void;
  folder: UploadFolder;
  assetName: string;
  defaultValue?: string;
  aspectClass?: string;
  configured: boolean;
  error?: string[] | undefined;
}) {
  const uid = useId();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function uploadFile(file: File) {
    if (!configured) {
      toast.info("Mode pratinjau: unggah ke Storage aktif setelah Supabase terhubung.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Format gambar harus JPG, PNG, atau WebP.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Ukuran gambar maksimal 4 MB.");
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("folder", folder);
      fd.append("name", assetName);
      fd.append("file", file);

      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = (await res.json()) as { ok: boolean; url?: string; error?: string };
      if (!json.ok || !json.url) {
        toast.error(json.error ?? "Gagal mengunggah gambar.");
        return;
      }
      onChange(json.url);
      toast.success(`${title} berhasil diunggah.`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col justify-between space-y-4 rounded-3xl border border-orchard/10 bg-white/85 p-5 shadow-soft">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-lg font-bold text-orchard">{title}</h3>
            <p className="mt-0.5 text-xs leading-relaxed text-moss">{description}</p>
          </div>
          {defaultValue !== undefined ? (
            <button
              type="button"
              onClick={() => onChange(defaultValue)}
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-orchard/15 bg-cream px-3 py-1 text-[11px] font-semibold text-orchard hover:bg-cream-2"
            >
              <RotateCcw className="size-3" />
              Default
            </button>
          ) : null}
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const dropped = e.dataTransfer.files[0];
            if (dropped) void uploadFile(dropped);
          }}
          className={cn(
            "relative overflow-hidden rounded-2xl border bg-orchard transition",
            aspectClass,
            dragOver ? "border-gold ring-4 ring-gold/25" : "border-orchard/15",
          )}
        >
          {value ? (
            <ProductImage src={value} alt={title} fill sizes="(max-width: 768px) 95vw, 420px" />
          ) : (
            <div className="grid size-full place-items-center bg-cream-2 px-4 text-center text-xs text-moss">
              Belum ada foto khusus — memakai tampilan default tema.
            </div>
          )}

          <label
            htmlFor={uid}
            className="absolute bottom-3 right-3 inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-cream/95 px-3.5 py-2 text-xs font-semibold text-orchard shadow-soft backdrop-blur transition hover:bg-gold"
          >
            <Upload className="size-3.5" />
            <span>{uploading ? "Mengunggah…" : "Unggah / Tarik Foto"}</span>
            <input
              id={uid}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void uploadFile(file);
              }}
              className="sr-only"
            />
          </label>
        </div>
      </div>

      <div>
        <Field label="Atau Tempel URL Gambar" htmlFor={`${uid}-url`}>
          <Input
            id={`${uid}-url`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={defaultValue || "https://... atau /images/..."}
            className="h-9 text-xs font-mono"
          />
        </Field>
        <FieldError messages={error} />
      </div>
    </div>
  );
}
