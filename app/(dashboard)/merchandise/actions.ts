"use server";

import { revalidatePath, updateTag } from "next/cache";

import { requireActionAdmin } from "@/lib/auth";
import { revalidateAnalyticsPages } from "@/lib/revalidate-analytics";
import {
  createMerchandise,
  deleteMerchandise,
  getMerchandiseById,
  MERCHANDISE_LIST_CACHE_TAG,
  restockMerchandise,
  updateMerchandise,
} from "@/lib/merchandise";

type ActionResult =
  | { ok: true }
  | { ok: false; message: string };

function revalidateMerchandisePages() {
  updateTag(MERCHANDISE_LIST_CACHE_TAG);
  revalidatePath("/merchandise");
  revalidatePath("/barang-keluar");
  revalidateAnalyticsPages();
}

export async function getMerchandiseFormData(id: number) {
  const auth = await requireActionAdmin();
  if (!auth.ok) return null;

  const data = await getMerchandiseById(id);
  if (!data) return null;

  return {
    nama_merch: data.nama_merch,
    deskripsi: data.deskripsi ?? "",
  };
}

export async function getMerchandiseRestockData(id: number) {
  const auth = await requireActionAdmin();
  if (!auth.ok) return null;

  const data = await getMerchandiseById(id);
  if (!data) return null;

  return {
    nama_merch: data.nama_merch,
    jumlah_stok: data.stok?.jumlah_stok ?? 0,
  };
}

export async function createMerchandiseAction(data: {
  nama_merch: string;
  deskripsi: string;
  jumlah_stok: number;
}): Promise<ActionResult> {
  try {
    const auth = await requireActionAdmin();
    if (!auth.ok) return auth;

    await createMerchandise(data);
    revalidateMerchandisePages();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan",
    };
  }
}

export async function updateMerchandiseAction(
  id: number,
  data: {
    nama_merch: string;
    deskripsi: string;
  }
): Promise<ActionResult> {
  try {
    const auth = await requireActionAdmin();
    if (!auth.ok) return auth;

    await updateMerchandise(id, data);
    revalidateMerchandisePages();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan",
    };
  }
}

export async function restockMerchandiseAction(
  id: number,
  data: {
    jumlah: number;
    keterangan: string;
  }
): Promise<ActionResult> {
  try {
    const auth = await requireActionAdmin();
    if (!auth.ok) return auth;

    await restockMerchandise(id, auth.user.id_user, data);
    revalidateMerchandisePages();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Gagal restock",
    };
  }
}

export async function deleteMerchandiseAction(id: number): Promise<ActionResult> {
  try {
    const auth = await requireActionAdmin();
    if (!auth.ok) return auth;

    await deleteMerchandise(id);
    revalidateMerchandisePages();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Gagal menghapus merchandise",
    };
  }
}
