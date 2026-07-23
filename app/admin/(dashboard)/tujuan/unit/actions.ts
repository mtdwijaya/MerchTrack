"use server";

import { revalidatePath, updateTag } from "next/cache";

import { requireActionAdmin } from "@/lib/auth";
import { revalidateAnalyticsPages } from "@/lib/revalidate-analytics";
import {
  createUnit,
  deleteUnit,
  getUnitById,
  UNIT_CACHE_TAG,
  updateUnit,
} from "@/lib/unit";
import { idParamSchema, parseSchema, unitSchema } from "@/lib/validations";

type ActionResult =
  | { ok: true }
  | { ok: false; message: string };

function revalidateUnitPages() {
  updateTag(UNIT_CACHE_TAG);
  revalidatePath("/admin/tujuan");
  revalidatePath("/admin/tujuan/unit");
  revalidatePath("/admin/barang-keluar");
  revalidateAnalyticsPages();
}

export async function getUnitFormData(id: number) {
  const auth = await requireActionAdmin();
  if (!auth.ok) return null;

  const idParsed = parseSchema(idParamSchema, id);
  if (!idParsed.ok) return null;

  const data = await getUnitById(idParsed.data);
  if (!data) return null;

  return {
    kode_unit: data.kode_unit,
    nama_unit: data.nama_unit,
  };
}

export async function createUnitAction(data: {
  kode_unit: string;
  nama_unit: string;
}): Promise<ActionResult> {
  try {
    const auth = await requireActionAdmin();
    if (!auth.ok) return auth;

    const parsed = parseSchema(unitSchema, data);
    if (!parsed.ok) return parsed;

    await createUnit(parsed.data);
    revalidateUnitPages();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan",
    };
  }
}

export async function updateUnitAction(
  id: number,
  data: { kode_unit: string; nama_unit: string }
): Promise<ActionResult> {
  try {
    const auth = await requireActionAdmin();
    if (!auth.ok) return auth;

    const idParsed = parseSchema(idParamSchema, id);
    if (!idParsed.ok) return idParsed;

    const parsed = parseSchema(unitSchema, data);
    if (!parsed.ok) return parsed;

    await updateUnit(idParsed.data, parsed.data);
    revalidateUnitPages();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan",
    };
  }
}

export async function deleteUnitAction(id: number): Promise<ActionResult> {
  try {
    const auth = await requireActionAdmin();
    if (!auth.ok) return auth;

    const idParsed = parseSchema(idParamSchema, id);
    if (!idParsed.ok) return idParsed;

    await deleteUnit(idParsed.data);
    revalidateUnitPages();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Gagal menghapus unit",
    };
  }
}
