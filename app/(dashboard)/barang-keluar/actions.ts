"use server";

import { revalidatePath } from "next/cache";

import { parseFormDateWithNowTime } from "@/lib/relative-time";

import { requireActionUser } from "@/lib/auth";
import { revalidateAnalyticsPages } from "@/lib/revalidate-analytics";
import { revalidateMerchandiseListCache } from "@/lib/merchandise";
import {
  createBarangKeluar,
  deleteBarangKeluar,
  getBarangKeluarById,
  updateBarangKeluar,
} from "@/lib/barang-keluar";
import {
  barangKeluarSchema,
  idParamSchema,
  parseSchema,
} from "@/lib/validations";

type ActionResult =
  | { ok: true }
  | { ok: false; message: string };

export async function getBarangKeluarFormData(id: number) {
  const auth = await requireActionUser();
  if (!auth.ok) return null;

  const idParsed = parseSchema(idParamSchema, id);
  if (!idParsed.ok) return null;

  const data = await getBarangKeluarById(idParsed.data);
  if (!data) return null;

  return {
    id_merch: data.id_merch,
    id_stasiun: data.id_stasiun,
    id_kategori: data.id_kategori,
    jumlah: data.jumlah,
    tanggal_keluar: data.tanggal_keluar.toISOString(),
    keterangan: data.keterangan ?? "",
  };
}

export async function createBarangKeluarAction(data: {
  id_merch: number;
  id_stasiun: number;
  id_kategori: number;
  jumlah: number;
  tanggal_keluar: string;
  keterangan: string;
}): Promise<ActionResult> {
  try {
    const auth = await requireActionUser();
    if (!auth.ok) return auth;

    const parsed = parseSchema(barangKeluarSchema, data);
    if (!parsed.ok) return parsed;

    await createBarangKeluar({
      id_merch: parsed.data.id_merch,
      id_stasiun: parsed.data.id_stasiun,
      id_kategori: parsed.data.id_kategori,
      id_user: auth.user.id_user,
      jumlah: parsed.data.jumlah,
      tanggal_keluar: parsed.data.tanggal_keluar
        ? parseFormDateWithNowTime(parsed.data.tanggal_keluar)
        : undefined,
      keterangan: parsed.data.keterangan,
    });

    revalidatePath("/barang-keluar");
    revalidatePath("/riwayat-transaksi");
    revalidateMerchandiseListCache();
    revalidateAnalyticsPages();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan",
    };
  }
}

export async function updateBarangKeluarAction(
  id: number,
  data: {
    id_merch: number;
    id_stasiun: number;
    id_kategori: number;
    jumlah: number;
    tanggal_keluar: string;
    keterangan: string;
  }
): Promise<ActionResult> {
  try {
    const auth = await requireActionUser();
    if (!auth.ok) return auth;

    const idParsed = parseSchema(idParamSchema, id);
    if (!idParsed.ok) return idParsed;

    const parsed = parseSchema(barangKeluarSchema, data);
    if (!parsed.ok) return parsed;

    if (!parsed.data.tanggal_keluar) {
      return { ok: false, message: "Tanggal keluar wajib diisi" };
    }

    await updateBarangKeluar(idParsed.data, {
      id_merch: parsed.data.id_merch,
      id_stasiun: parsed.data.id_stasiun,
      id_kategori: parsed.data.id_kategori,
      jumlah: parsed.data.jumlah,
      tanggal_keluar: parseFormDateWithNowTime(parsed.data.tanggal_keluar),
      keterangan: parsed.data.keterangan,
    });

    revalidatePath("/barang-keluar");
    revalidatePath("/riwayat-transaksi");
    revalidateMerchandiseListCache();
    revalidateAnalyticsPages();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan",
    };
  }
}

export async function deleteBarangKeluarAction(id: number): Promise<ActionResult> {
  try {
    const auth = await requireActionUser();
    if (!auth.ok) return auth;

    const idParsed = parseSchema(idParamSchema, id);
    if (!idParsed.ok) return idParsed;

    await deleteBarangKeluar(idParsed.data);
    revalidatePath("/barang-keluar");
    revalidatePath("/riwayat-transaksi");
    revalidateMerchandiseListCache();
    revalidateAnalyticsPages();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Gagal menghapus data",
    };
  }
}
