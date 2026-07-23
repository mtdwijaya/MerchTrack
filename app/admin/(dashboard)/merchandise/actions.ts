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
import { saveMerchandiseFotoFromFormData } from "@/lib/upload-merchandise-foto";
import { deleteUploadedPublicFile } from "@/lib/upload-file-cleanup";
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
  revalidatePath("/admin/merchandise");
  revalidatePath("/admin/barang-keluar");
  revalidatePath("/admin/monitoring");
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
    foto_path: data.foto_path ?? null,
    foto_nama: data.foto_nama ?? null,
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

export async function createMerchandiseAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const auth = await requireActionAdmin();
    if (!auth.ok) return auth;

    const parsed = parseSchema(merchandiseCreateSchema, {
      nama_merch: formData.get("nama_merch"),
      deskripsi: formData.get("deskripsi") || undefined,
      jumlah_stok: formData.get("jumlah_stok"),
    });
    if (!parsed.ok) return parsed;

    const foto = await saveMerchandiseFotoFromFormData(formData);

    await createMerchandise(
      {
        ...parsed.data,
        foto_path: foto?.foto_path ?? null,
        foto_nama: foto?.foto_nama ?? null,
      },
      auth.user.id_user
    );
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
  formData: FormData
): Promise<ActionResult> {
  try {
    const auth = await requireActionAdmin();
    if (!auth.ok) return auth;

    const idParsed = parseSchema(idParamSchema, id);
    if (!idParsed.ok) return idParsed;

    const parsed = parseSchema(merchandiseUpdateSchema, {
      nama_merch: formData.get("nama_merch"),
      deskripsi: formData.get("deskripsi") || undefined,
    });
    if (!parsed.ok) return parsed;

    const foto = await saveMerchandiseFotoFromFormData(formData);
    const hapusFoto = formData.get("hapus_foto") === "1";

    const existing = await getMerchandiseById(idParsed.data);
    if (!existing) {
      return { ok: false, message: "Merchandise tidak ditemukan" };
    }

    if (foto) {
      if (existing.foto_path) {
        await deleteUploadedPublicFile(existing.foto_path);
      }
      await updateMerchandise(idParsed.data, {
        ...parsed.data,
        foto_path: foto.foto_path,
        foto_nama: foto.foto_nama,
      });
    } else if (hapusFoto) {
      if (existing.foto_path) {
        await deleteUploadedPublicFile(existing.foto_path);
      }
      await updateMerchandise(idParsed.data, {
        ...parsed.data,
        foto_path: null,
        foto_nama: null,
      });
    } else {
      await updateMerchandise(idParsed.data, parsed.data);
    }

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
    revalidatePath("/admin/monitoring");
    revalidatePath("/admin/riwayat-transaksi");
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
