import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([".pdf", ".jpg", ".jpeg", ".png"]);
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
]);

function getExtension(filename: string) {
  return path.extname(filename).toLowerCase();
}

function mimeFromExtension(ext: string) {
  switch (ext) {
    case ".pdf":
      return "application/pdf";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    default:
      return "";
  }
}

function resolveFileName(file: Blob, fallback = "bukti") {
  if (file instanceof File && file.name.trim()) {
    return file.name.trim();
  }
  return fallback;
}

/** Wajib ext DAN mime cocok (bukan OR) agar upload lebih ketat. */
function isAllowedBukti(file: Blob, filename: string) {
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
  if (ext === ".pdf") {
    return buffer.subarray(0, 4).toString("ascii") === "%PDF";
  }
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
  return false;
}

export function isBuktiFile(value: unknown): value is Blob {
  return (
    typeof value === "object" &&
    value !== null &&
    "arrayBuffer" in value &&
    "size" in value &&
    typeof (value as Blob).size === "number"
  );
}

export async function saveBuktiFile(file: Blob, prefix: string, filename?: string) {
  if (!isBuktiFile(file) || file.size === 0) {
    throw new Error("File bukti tidak valid");
  }

  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("Ukuran file bukti maksimal 5MB");
  }

  const originalName = filename ?? resolveFileName(file);

  if (!isAllowedBukti(file, originalName)) {
    throw new Error("Format file harus PDF, JPG, atau PNG");
  }

  const ext = getExtension(originalName);
  const buffer = Buffer.from(await file.arrayBuffer());

  if (!sniffMagic(buffer, ext)) {
    throw new Error("Isi file tidak sesuai format yang diizinkan");
  }

  const storedName = `${prefix}-${Date.now()}-${randomBytes(8).toString("hex")}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "bukti");

  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, storedName), buffer);

  return {
    bukti_path: `/uploads/bukti/${storedName}`,
    bukti_nama: originalName.replace(/[^\w.\-()\s]/g, "_").slice(0, 120),
  };
}

export async function saveBuktiFromFormData(
  formData: FormData,
  prefix: string
) {
  const entry = formData.get("bukti");

  if (!entry || typeof entry === "string") {
    return null;
  }

  if (!isBuktiFile(entry) || entry.size === 0) {
    return null;
  }

  const filename = entry instanceof File ? entry.name : undefined;
  return saveBuktiFile(entry, prefix, filename);
}
