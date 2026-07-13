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

const barangKeluarDetailFields = {
  id_tujuan: idParamSchema,
  id_stasiun: z
    .union([idParamSchema, z.literal(0), z.null()])
    .optional()
    .transform((v) => (v === 0 || v == null ? undefined : v)),
  id_unit: z
    .union([idParamSchema, z.literal(0), z.null()])
    .optional()
    .transform((v) => (v === 0 || v == null ? undefined : v)),
  detail_teks: optionalText(500),
  tanggal_keluar: z.string().optional().or(z.literal("")),
  keterangan: optionalText(500),
};

export const barangKeluarItemSchema = z.object({
  id_keluar: idParamSchema.optional(),
  id_merch: idParamSchema,
  jumlah: z.coerce
    .number()
    .int("Jumlah harus bilangan bulat")
    .positive("Jumlah harus lebih dari 0"),
});

export const barangKeluarEditItemSchema = barangKeluarItemSchema.extend({
  id_keluar: idParamSchema,
});

function refineNoDuplicateMerch(
  data: { items: { id_merch: number }[] },
  ctx: z.RefinementCtx
) {
  const merchIds = data.items.map((item) => item.id_merch);
  const duplicates = merchIds.filter(
    (id, index) => merchIds.indexOf(id) !== index
  );

  if (duplicates.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Merchandise tidak boleh duplikat dalam satu transaksi",
      path: ["items"],
    });
  }
}

export const barangKeluarBatchSchema = z
  .object({
    ...barangKeluarDetailFields,
    items: z
      .array(barangKeluarItemSchema)
      .min(1, "Minimal 1 merchandise wajib diisi"),
  })
  .superRefine(refineNoDuplicateMerch);

export const barangKeluarEditBatchSchema = z
  .object({
    ...barangKeluarDetailFields,
    items: z
      .array(barangKeluarEditItemSchema)
      .min(1, "Minimal 1 merchandise wajib diisi"),
  })
  .superRefine(refineNoDuplicateMerch);

export const barangKeluarSchema = z.object({
  id_merch: idParamSchema,
  ...barangKeluarDetailFields,
  jumlah: z.coerce
    .number()
    .int("Jumlah harus bilangan bulat")
    .positive("Jumlah harus lebih dari 0"),
});

export const barangKembaliSchema = z.object({
  jumlah_kembali: z.coerce
    .number()
    .int("Jumlah harus bilangan bulat")
    .positive("Jumlah kembali harus lebih dari 0"),
  tanggal_kembali: z.string().optional().or(z.literal("")),
  pengembali: z
    .string()
    .trim()
    .min(1, "Nama pengembali wajib diisi")
    .max(200, "Nama pengembali terlalu panjang"),
  asal: z
    .string()
    .trim()
    .min(1, "Asal wajib diisi")
    .max(200, "Asal terlalu panjang"),
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
