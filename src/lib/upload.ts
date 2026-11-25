const ALLOWED_MIME_EXT: Record<string, "jpg" | "png" | "webp"> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Validates MIME type, byte size, and actual file signature (magic bytes). */
export async function validateUploadedImage(
  file: File,
  maxBytes: number,
): Promise<{ ok: true; ext: "jpg" | "png" | "webp"; buffer: Buffer; contentType: string } | { ok: false; error: string }> {
  const mappedExt = ALLOWED_MIME_EXT[file.type.toLowerCase()];
  if (!mappedExt) {
    return { ok: false, error: "Format file harus JPG, PNG, atau WebP." };
  }
  if (file.size <= 0 || file.size > maxBytes) {
    const mb = (maxBytes / (1024 * 1024)).toFixed(0);
    return { ok: false, error: `Ukuran gambar maksimal ${mb} MB.` };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length < 12) {
    return { ok: false, error: "File gambar rusak atau kosong." };
  }

  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  const isWebp =
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP";

  if ((mappedExt === "jpg" && !isJpeg) || (mappedExt === "png" && !isPng) || (mappedExt === "webp" && !isWebp)) {
    return { ok: false, error: "Isi file tidak sesuai dengan format gambar JPG/PNG/WebP." };
  }

  return {
    ok: true,
    ext: mappedExt,
    buffer,
    contentType: mappedExt === "jpg" ? "image/jpeg" : `image/${mappedExt}`,
  };
}
