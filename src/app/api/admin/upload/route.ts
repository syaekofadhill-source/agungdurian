import { NextResponse } from "next/server";
import { z } from "zod";

import { PRODUCT_IMAGE_BUCKET, SITE_ASSETS_BUCKET } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validateUploadedImage } from "@/lib/upload";
import { slugify } from "@/lib/utils";

const folderSchema = z.enum(["products", "hero", "branding", "sections", "payment"]);
const MAX_BYTES = 4 * 1024 * 1024; // 4 MB

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Supabase belum dikonfigurasi di .env.local." },
      { status: 503 },
    );
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Klien Supabase tidak tersedia." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Sesi admin tidak valid." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const rawFolder = formData.get("folder");
  const rawName = formData.get("name");

  const folderParsed = folderSchema.safeParse(rawFolder ?? "sections");
  if (!folderParsed.success) {
    return NextResponse.json({ ok: false, error: "Folder tujuan tidak valid." }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Pilih file gambar untuk diunggah." }, { status: 400 });
  }

  const validated = await validateUploadedImage(file, MAX_BYTES);
  if (!validated.ok) {
    return NextResponse.json({ ok: false, error: validated.error }, { status: 400 });
  }

  const folder = folderParsed.data;
  const bucket = folder === "products" ? PRODUCT_IMAGE_BUCKET : SITE_ASSETS_BUCKET;
  const baseName = slugify(typeof rawName === "string" && rawName ? rawName : file.name.replace(/\.[^.]+$/, "")) || "asset";
  const path = `${folder}/${Date.now()}-${baseName}.${validated.ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, validated.buffer, {
    contentType: validated.contentType,
    cacheControl: "3600",
    upsert: true,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: `Gagal mengunggah: ${error.message}` }, { status: 500 });
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return NextResponse.json({ ok: true, url: data.publicUrl, path, bucket });
}
