import { mkdir, writeFile } from "fs/promises";
import path from "path";

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

function isAllowedBukti(file: Blob, filename: string) {
  const ext = getExtension(filename);
  const mime = file.type || mimeFromExtension(ext);

  if (ext && ALLOWED_EXTENSIONS.has(ext)) {
    return true;
  }

  if (mime && ALLOWED_MIME_TYPES.has(mime)) {
    return true;
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

  const ext = getExtension(originalName) || ".pdf";
  const safeBase = originalName
    .replace(ext, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .slice(0, 40) || "bukti";
  const storedName = `${prefix}-${Date.now()}-${safeBase}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "bukti");

  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, storedName), buffer);

  return {
    bukti_path: `/uploads/bukti/${storedName}`,
    bukti_nama: originalName,
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
