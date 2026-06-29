import { z } from "zod";

export const idParamSchema = z.coerce.number().int().positive("ID tidak valid");

const optionalText = (max: number) =>
  z.string().max(max, `Maksimal ${max} karakter`).optional().or(z.literal(""));

export function parseSchema<T>(
  schema: z.ZodType<T>,
  data: unknown
): { ok: true; data: T } | { ok: false; message: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issue = result.error.issues[0];
    return { ok: false, message: issue?.message ?? "Data tidak valid" };
  }
  return { ok: true, data: result.data };
}

export const loginSchema = z.object({
  email: z.string().trim().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export const barangKeluarSchema = z.object({
  id_merch: idParamSchema,
  id_stasiun: idParamSchema,
  id_kategori: idParamSchema,
  jumlah: z.coerce
    .number()
    .int("Jumlah harus bilangan bulat")
    .positive("Jumlah harus lebih dari 0"),
  tanggal_keluar: z.string().optional().or(z.literal("")),
  keterangan: optionalText(500),
});

export const merchandiseCreateSchema = z.object({
  nama_merch: z
    .string()
    .trim()
    .min(1, "Nama merchandise wajib diisi")
    .max(200, "Nama merchandise terlalu panjang"),
  deskripsi: optionalText(1000),
  jumlah_stok: z.coerce
    .number()
    .int("Stok harus bilangan bulat")
    .min(0, "Stok tidak boleh negatif"),
});

export const merchandiseUpdateSchema = z.object({
  nama_merch: z
    .string()
    .trim()
    .min(1, "Nama merchandise wajib diisi")
    .max(200, "Nama merchandise terlalu panjang"),
  deskripsi: optionalText(1000),
});

export const merchandiseRestockSchema = z.object({
  jumlah: z.coerce
    .number()
    .int("Jumlah harus bilangan bulat")
    .positive("Jumlah restock harus lebih dari 0"),
  keterangan: optionalText(500),
});

export const stasiunSchema = z.object({
  kode_stasiun: z
    .string()
    .trim()
    .min(1, "Kode stasiun wajib diisi")
    .max(20, "Kode stasiun terlalu panjang"),
  nama_stasiun: z
    .string()
    .trim()
    .min(1, "Nama stasiun wajib diisi")
    .max(200, "Nama stasiun terlalu panjang"),
  alamat: optionalText(500),
  kontak: optionalText(100),
});

export const penggunaCreateSchema = z.object({
  nama_user: z
    .string()
    .trim()
    .min(1, "Nama pengguna wajib diisi")
    .max(200, "Nama pengguna terlalu panjang"),
  email: z.string().trim().email("Format email tidak valid"),
  password: z
    .string()
    .min(6, "Password minimal 6 karakter")
    .max(128, "Password terlalu panjang"),
  role: z.enum(["ADMIN", "PETUGAS"]),
  id_stasiun: z
    .union([idParamSchema, z.null(), z.literal("")])
    .optional()
    .transform((v) => (v === "" || v == null ? undefined : v)),
});

export const penggunaUpdateSchema = z.object({
  nama_user: z
    .string()
    .trim()
    .min(1, "Nama pengguna wajib diisi")
    .max(200, "Nama pengguna terlalu panjang"),
  email: z.string().trim().email("Format email tidak valid"),
  password: z
    .string()
    .max(128, "Password terlalu panjang")
    .optional()
    .or(z.literal("")),
  role: z.enum(["ADMIN", "PETUGAS"]),
  id_stasiun: z
    .union([idParamSchema, z.null(), z.literal("")])
    .optional()
    .transform((v) => (v === "" || v == null ? undefined : v)),
});
