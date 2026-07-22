"use server";

import { requireActionUser } from "@/lib/auth";
import { getBarangMasukDetail } from "@/lib/barang-masuk";
import {
  generateLaporanData,
  type LaporanGenerateInput,
  type LaporanGenerateResult,
  type LaporanJenis,
  type LaporanPeriode,
} from "@/lib/laporan-generate";
import { idParamSchema, parseSchema } from "@/lib/validations";
import { z } from "zod";

export async function getBarangMasukDetailAction(id: number) {
  const auth = await requireActionUser();
  if (!auth.ok) return null;

  const idParsed = parseSchema(idParamSchema, id);
  if (!idParsed.ok) return null;

  return getBarangMasukDetail(idParsed.data);
}

const laporanGenerateSchema = z
  .object({
    jenis: z.enum(["keluar", "masuk", "restock", "semua"]),
    id_merch: z
      .union([z.coerce.number().int().positive(), z.null()])
      .optional(),
    periode: z.enum(["1", "7", "30", "custom", "semua"]),
    tanggal_dari: z.string().optional().or(z.literal("")),
    tanggal_sampai: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.periode === "custom") {
      if (!data.tanggal_dari) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tanggal mulai wajib diisi",
          path: ["tanggal_dari"],
        });
      }
      if (!data.tanggal_sampai) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tanggal akhir wajib diisi",
          path: ["tanggal_sampai"],
        });
      }
    }
  });

export type GenerateLaporanActionResult =
  | { ok: true; data: LaporanGenerateResult }
  | { ok: false; message: string };

export async function generateLaporanAction(
  input: LaporanGenerateInput
): Promise<GenerateLaporanActionResult> {
  try {
    const auth = await requireActionUser();
    if (!auth.ok) return { ok: false, message: auth.message };

    const parsed = parseSchema(laporanGenerateSchema, input);
    if (!parsed.ok) return parsed;

    const data = await generateLaporanData({
      jenis: parsed.data.jenis as LaporanJenis,
      id_merch: parsed.data.id_merch ?? null,
      periode: parsed.data.periode as LaporanPeriode,
      tanggal_dari: parsed.data.tanggal_dari || undefined,
      tanggal_sampai: parsed.data.tanggal_sampai || undefined,
    });

    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Gagal membuat laporan",
    };
  }
}

function mapRiwayatJenisToLaporan(jenis?: string): LaporanJenis {
  switch (jenis) {
    case "KELUAR":
      return "keluar";
    case "MASUK":
      return "masuk";
    case "RESTOCK":
      return "restock";
    default:
      return "semua";
  }
}

export async function generatePreviewAction(filters: {
  jenis?: string;
  id_merch?: number | null;
  tanggal_dari?: string;
  tanggal_sampai?: string;
}): Promise<GenerateLaporanActionResult> {
  const hasRange = Boolean(filters.tanggal_dari && filters.tanggal_sampai);

  return generateLaporanAction({
    jenis: mapRiwayatJenisToLaporan(filters.jenis),
    id_merch: filters.id_merch ?? null,
    periode: hasRange ? "custom" : "semua",
    tanggal_dari: filters.tanggal_dari,
    tanggal_sampai: filters.tanggal_sampai,
  });
}
