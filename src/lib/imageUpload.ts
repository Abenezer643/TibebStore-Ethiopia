import path from "path";
import { mkdir, writeFile } from "fs/promises";
import sharp from "sharp";

export const ALLOWED_IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function validateUploadedImage(file: File) {
  const mime = String((file as any)?.type ?? "").toLowerCase();
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(mime as any)) {
    return { ok: false as const, error: "Unsupported file type" };
  }
  if (typeof file.size === "number" && file.size > MAX_IMAGE_BYTES) {
    return { ok: false as const, error: "File too large" };
  }
  return { ok: true as const };
}

function toSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export async function saveSquareImageToUploads(params: {
  file: File;
  baseName: string;
  size: number;
}) {
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const originalName = String(params.file.name || "image");
  const safeBase = toSlug(params.baseName) || "image";
  const uniqueName = `${safeBase}-${Date.now()}.png`;
  const outPath = path.join(uploadsDir, uniqueName);

  const bytes = Buffer.from(await params.file.arrayBuffer());
  const image = sharp(bytes);
  const meta = await image.metadata().catch(() => null);

  const size = params.size;
  const out = await image
    .resize(size, size, { fit: "cover", position: "centre" })
    .png({ quality: 90 })
    .toBuffer();

  await writeFile(outPath, out);

  return {
    url: `/uploads/${uniqueName}`,
    alt: originalName,
    width: size,
    height: size,
    id: `/uploads/${uniqueName}`,
    meta,
  };
}
