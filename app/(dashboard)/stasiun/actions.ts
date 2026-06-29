"use server";

import { revalidatePath, updateTag } from "next/cache";

import { requireActionAdmin } from "@/lib/auth";
import { revalidateAnalyticsPages } from "@/lib/revalidate-analytics";
import {
  createStasiun,
  deleteStasiun,
  getStasiunById,
  STASIUN_CACHE_TAG,
  updateStasiun,
} from "@/lib/stasiun";
import { idParamSchema, parseSchema, stasiunSchema } from "@/lib/validations";

type ActionResult =
  | { ok: true }
  | { ok: false; message: string };

function revalidateStasiunPages() {
  updateTag(STASIUN_CACHE_TAG);
  revalidatePath("/stasiun");
  revalidatePath("/barang-keluar");
  revalidatePath("/pengguna");
  revalidateAnalyticsPages();
}

export async function getStasiunFormData(id: number) {
  const auth = await requireActionAdmin();
  if (!auth.ok) return null;

  const idParsed = parseSchema(idParamSchema, id);
  if (!idParsed.ok) return null;

  const data = await getStasiunById(idParsed.data);
  if (!data) return null;

  return {
    kode_stasiun: data.kode_stasiun,
    nama_stasiun: data.nama_stasiun,
    alamat: data.alamat ?? "",
    kontak: data.kontak ?? "",
  };
}

export async function createStasiunAction(data: {
  kode_stasiun: string;
  nama_stasiun: string;
  alamat: string;
  kontak: string;
}): Promise<ActionResult> {
  try {
    const auth = await requireActionAdmin();
    if (!auth.ok) return auth;

    const parsed = parseSchema(stasiunSchema, data);
    if (!parsed.ok) return parsed;

    await createStasiun(parsed.data);
    revalidateStasiunPages();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan",
    };
  }
}

export async function updateStasiunAction(
  id: number,
  data: {
    kode_stasiun: string;
    nama_stasiun: string;
    alamat: string;
    kontak: string;
  }
): Promise<ActionResult> {
  try {
    const auth = await requireActionAdmin();
    if (!auth.ok) return auth;

    const idParsed = parseSchema(idParamSchema, id);
    if (!idParsed.ok) return idParsed;

    const parsed = parseSchema(stasiunSchema, data);
    if (!parsed.ok) return parsed;

    await updateStasiun(idParsed.data, parsed.data);
    revalidateStasiunPages();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan",
    };
  }
}

export async function deleteStasiunAction(id: number): Promise<ActionResult> {
  try {
    const auth = await requireActionAdmin();
    if (!auth.ok) return auth;

    const idParsed = parseSchema(idParamSchema, id);
    if (!idParsed.ok) return idParsed;

    await deleteStasiun(idParsed.data);
    revalidateStasiunPages();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Gagal menghapus stasiun",
    };
  }
}
