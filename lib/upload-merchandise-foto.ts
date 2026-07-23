import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

function getExtension(filename: string) {
  return path.extname(filename).toLowerCase();
}

function mimeFromExtension(ext: string) {
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    default:
      return "";
  }
}

function resolveFileName(file: Blob, fallback = "foto") {
  if (file instanceof File && file.name.trim()) {
    return file.name.trim();
  }
  return fallback;
}

function isAllowedFoto(file: Blob, filename: string) {
  const ext = getExtension(filename);
  if (!ALLOWED_EXTENSIONS.has(ext)) return false;

  const mime = (file.type || mimeFromExtension(ext)).toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mime)) return false;

  if (ext === ".jpg" || ext === ".jpeg") {
    return mime === "image/jpeg" || mime === "image/jpg";
  }

  return mime === mimeFromExtension(ext);
}

function sniffMagic(buffer: Buffer, ext: string) {
  if (ext === ".png") {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    );
  }
  if (ext === ".jpg" || ext === ".jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (ext === ".webp") {
    return (
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }
  return false;
}

function isFotoFile(value: unknown): value is Blob {
  return (
    typeof value === "object" &&
    value !== null &&
    "arrayBuffer" in value &&
    "size" in value &&
    typeof (value as Blob).size === "number"
  );
}

export async function saveMerchandiseFotoFile(
  file: Blob,
  filename?: string
) {
  if (!isFotoFile(file) || file.size === 0) {
    throw new Error("File foto tidak valid");
  }

  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("Ukuran foto maksimal 5MB");
  }

  const originalName = filename ?? resolveFileName(file);

  if (!isAllowedFoto(file, originalName)) {
    throw new Error("Format foto harus JPG, PNG, atau WEBP");
  }

  const ext = getExtension(originalName);
  const buffer = Buffer.from(await file.arrayBuffer());

  if (!sniffMagic(buffer, ext)) {
    throw new Error("Isi file tidak sesuai format gambar yang diizinkan");
  }

  const storedName = `merch-${Date.now()}-${randomBytes(8).toString("hex")}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "merchandise");

  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, storedName), buffer);

  return {
    foto_path: `/uploads/merchandise/${storedName}`,
    foto_nama: originalName.replace(/[^\w.\-()\s]/g, "_").slice(0, 120),
  };
}

export async function saveMerchandiseFotoFromFormData(formData: FormData) {
  const entry = formData.get("foto");

  if (!entry || typeof entry === "string") {
    return null;
  }

  if (!isFotoFile(entry) || entry.size === 0) {
    return null;
  }

  const filename = entry instanceof File ? entry.name : undefined;
  return saveMerchandiseFotoFile(entry, filename);
}
