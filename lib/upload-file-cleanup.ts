import { unlink } from "fs/promises";
import path from "path";

/**
 * Hapus file di public/uploads/* secara aman (abaikan jika tidak ada).
 * Hanya path yang diawali `/uploads/` yang diizinkan.
 */
export async function deleteUploadedPublicFile(
  publicPath: string | null | undefined
) {
  if (!publicPath?.startsWith("/uploads/")) return;

  const uploadsRoot = path.resolve(process.cwd(), "public", "uploads");
  const absolute = path.resolve(
    process.cwd(),
    "public",
    publicPath.replace(/^\//, "")
  );

  if (absolute !== uploadsRoot && !absolute.startsWith(uploadsRoot + path.sep)) {
    return;
  }

  try {
    await unlink(absolute);
  } catch {
    // file mungkin sudah tidak ada
  }
}
