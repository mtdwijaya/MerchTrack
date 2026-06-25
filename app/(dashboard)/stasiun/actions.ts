"use server";

import { revalidatePath, updateTag } from "next/cache";

import { revalidateAnalyticsPages } from "@/lib/revalidate-analytics";

import {
  createStasiun,
  deleteStasiun,
  getStasiunById,
  STASIUN_CACHE_TAG,
  updateStasiun,
} from "@/lib/stasiun";

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
  const data = await getStasiunById(id);
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
    await createStasiun(data);
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
    await updateStasiun(id, data);
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
    await deleteStasiun(id);
    revalidateStasiunPages();
     return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Gagal menghapus stasiun",
    };
  }
}
