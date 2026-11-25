import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { PAYMENT_PROOFS_BUCKET } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabasePublicClient } from "@/lib/supabase/server";
import { validateUploadedImage } from "@/lib/upload";

const orderCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^AGD-[0-9]{8}-[A-Z0-9]{4}$/, { error: "Kode pesanan tidak valid." });

const MAX_BYTES = 3 * 1024 * 1024; // 3 MB

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const codeParsed = orderCodeSchema.safeParse(formData.get("orderCode"));

  if (!codeParsed.success) {
    return NextResponse.json({ ok: false, error: "Kode pesanan tidak valid." }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Pilih foto/screenshot bukti transfer DANA." }, { status: 400 });
  }

  const validated = await validateUploadedImage(file, MAX_BYTES);
  if (!validated.ok) {
    return NextResponse.json({ ok: false, error: validated.error }, { status: 400 });
  }

  const orderCode = codeParsed.data;

  if (!isSupabaseConfigured()) {
    // Demo mode fallback: accept validated file and return a harmless preview placeholder.
    return NextResponse.json({
      ok: true,
      demo: true,
      proofUrl: "/images/products/bawor.webp",
      message: "Mode pratinjau: bukti transfer diverifikasi di klien.",
    });
  }

  const supabase = createSupabasePublicClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Layanan penyimpanan tidak tersedia." }, { status: 503 });
  }

  const { data: order, error: lookupError } = await supabase.rpc("get_public_order", {
    p_order_code: orderCode,
  });

  if (lookupError || !order) {
    return NextResponse.json({ ok: false, error: "Pesanan tidak ditemukan." }, { status: 404 });
  }
  if (order.payment_method !== "dana") {
    return NextResponse.json({ ok: false, error: "Pesanan ini tidak menggunakan pembayaran DANA." }, { status: 400 });
  }
  if (order.status === "completed" || order.status === "cancelled") {
    return NextResponse.json({ ok: false, error: "Pesanan sudah selesai atau dibatalkan." }, { status: 400 });
  }

  const path = `${orderCode}/${Date.now()}.${validated.ext}`;
  const { error: uploadError } = await supabase.storage
    .from(PAYMENT_PROOFS_BUCKET)
    .upload(path, validated.buffer, {
      contentType: validated.contentType,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ ok: false, error: `Gagal mengunggah bukti: ${uploadError.message}` }, { status: 500 });
  }

  const { data: pub } = supabase.storage.from(PAYMENT_PROOFS_BUCKET).getPublicUrl(path);
  const { data: updated, error: attachError } = await supabase.rpc("attach_order_payment_proof", {
    p_order_code: orderCode,
    p_proof_url: pub.publicUrl,
  });

  if (attachError) {
    return NextResponse.json({ ok: false, error: attachError.message }, { status: 400 });
  }

  revalidatePath(`/order/${orderCode}`);
  revalidatePath("/admin");
  revalidatePath("/admin/pesanan");

  return NextResponse.json({ ok: true, proofUrl: pub.publicUrl, order: updated });
}
