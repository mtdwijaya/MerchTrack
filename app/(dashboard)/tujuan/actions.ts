"use server";

import { revalidatePath, updateTag } from "next/cache";
import type { JenisDetailTujuan } from "@prisma/client";

import { requireActionAdmin } from "@/lib/auth";
import { revalidateAnalyticsPages } from "@/lib/revalidate-analytics";
import {
  createTujuan,
  deleteTujuan,
  getTujuanById,
  TUJUAN_CACHE_TAG,
  updateTujuan,
} from "@/lib/tujuan";
import { idParamSchema, parseSchema, tujuanSchema } from "@/lib/validations";

type ActionResult =
  | { ok: true }
  | { ok: false; message: string };

function revalidateTujuanPages() {
  updateTag(TUJUAN_CACHE_TAG);
  revalidatePath("/tujuan");
  revalidatePath("/barang-keluar");
  revalidateAnalyticsPages();
}

export async function getTujuanFormData(id: number) {
  const auth = await requireActionAdmin();
  if (!auth.ok) return null;

  const idParsed = parseSchema(idParamSchema, id);
  if (!idParsed.ok) return null;

  const data = await getTujuanById(idParsed.data);
  if (!data) return null;

  return {
    nama_tujuan: data.nama_tujuan,
    jenis_detail: data.jenis_detail,
    label_detail: data.label_detail ?? "",
    boleh_return: data.boleh_return,
  };
}

export async function createTujuanAction(data: {
  nama_tujuan: string;
  jenis_detail?: JenisDetailTujuan;
  label_detail: string;
  boleh_return: boolean;
}): Promise<ActionResult> {
  try {
    const auth = await requireActionAdmin();
    if (!auth.ok) return auth;

    // Tujuan baru selalu free text; jenis Stasiun/Unit tetap dari seed.
    const parsed = parseSchema(tujuanSchema, {
      ...data,
      jenis_detail: "TEKS",
    });
    if (!parsed.ok) return parsed;

    await createTujuan(parsed.data);
    revalidateTujuanPages();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan",
    };
  }
}

export async function updateTujuanAction(
  id: number,
  data: {
    nama_tujuan: string;
    jenis_detail?: JenisDetailTujuan;
    label_detail: string;
    boleh_return: boolean;
  }
): Promise<ActionResult> {
  try {
    const auth = await requireActionAdmin();
    if (!auth.ok) return auth;

    const idParsed = parseSchema(idParamSchema, id);
    if (!idParsed.ok) return idParsed;

    const existing = await getTujuanById(idParsed.data);
    if (!existing) {
      return { ok: false, message: "Tujuan tidak ditemukan" };
    }

    // jenis_detail tidak diubah dari form (sudah fix per kategori).
    const parsed = parseSchema(tujuanSchema, {
      ...data,
      jenis_detail: existing.jenis_detail,
    });
    if (!parsed.ok) return parsed;

    await updateTujuan(idParsed.data, parsed.data);
    revalidateTujuanPages();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan",
    };
  }
}

export async function deleteTujuanAction(id: number): Promise<ActionResult> {
  try {
    const auth = await requireActionAdmin();
    if (!auth.ok) return auth;

    const idParsed = parseSchema(idParamSchema, id);
    if (!idParsed.ok) return idParsed;

    await deleteTujuan(idParsed.data);
    revalidateTujuanPages();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Gagal menghapus tujuan",
    };
  }
}
