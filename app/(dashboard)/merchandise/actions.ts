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
import {
  parseRestockBukti,
  parseRestockFormData,
} from "@/lib/parse-transaksi-form";
import {
  idParamSchema,
  merchandiseCreateSchema,
  merchandiseUpdateSchema,
  parseSchema,
} from "@/lib/validations";

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

  const idParsed = parseSchema(idParamSchema, id);
  if (!idParsed.ok) return null;

  const data = await getMerchandiseById(idParsed.data);
  if (!data) return null;

  return {
    nama_merch: data.nama_merch,
    deskripsi: data.deskripsi ?? "",
  };
}

export async function getMerchandiseRestockData(id: number) {
  const auth = await requireActionAdmin();
  if (!auth.ok) return null;

  const idParsed = parseSchema(idParamSchema, id);
  if (!idParsed.ok) return null;

  const data = await getMerchandiseById(idParsed.data);
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

    const parsed = parseSchema(merchandiseCreateSchema, data);
    if (!parsed.ok) return parsed;

    await createMerchandise(parsed.data, auth.user.id_user);
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

    const idParsed = parseSchema(idParamSchema, id);
    if (!idParsed.ok) return idParsed;

    const parsed = parseSchema(merchandiseUpdateSchema, data);
    if (!parsed.ok) return parsed;

    await updateMerchandise(idParsed.data, parsed.data);
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
  formData: FormData
): Promise<ActionResult> {
  try {
    const auth = await requireActionAdmin();
    if (!auth.ok) return auth;

    const idParsed = parseSchema(idParamSchema, id);
    if (!idParsed.ok) return idParsed;

    const parsed = parseRestockFormData(formData);
    if (!parsed.ok) return parsed;

    const bukti = await parseRestockBukti(formData);

    await restockMerchandise(idParsed.data, auth.user.id_user, {
      ...parsed.data,
      bukti_path: bukti?.bukti_path ?? null,
      bukti_nama: bukti?.bukti_nama ?? null,
    });
    revalidateMerchandisePages();
    revalidatePath("/monitoring");
    revalidatePath("/riwayat-transaksi");
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

    const idParsed = parseSchema(idParamSchema, id);
    if (!idParsed.ok) return idParsed;

    await deleteMerchandise(idParsed.data);
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
