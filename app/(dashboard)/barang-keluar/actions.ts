"use server";

// server actions: dipanggil dari form client, jalan di server (aman untuk db & auth)
import { revalidatePath } from "next/cache";

import { requireActionUser } from "@/lib/auth";
import { revalidateAnalyticsPages } from "@/lib/revalidate-analytics";
import { revalidateMerchandiseListCache } from "@/lib/merchandise";
import {
  createBarangKeluar,
  deleteBarangKeluar,
  getBarangKeluarById,
  updateBarangKeluar,
} from "@/lib/barang-keluar";

type ActionResult =
  | { ok: true }
  | { ok: false; message: string };

export async function getBarangKeluarFormData(id: number) {
  const auth = await requireActionUser();
  if (!auth.ok) return null;

  const data = await getBarangKeluarById(id);
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

    await createBarangKeluar({
      id_merch: data.id_merch,
      id_stasiun: data.id_stasiun,
      id_kategori: data.id_kategori,
      id_user: auth.user.id_user,
      jumlah: data.jumlah,
      tanggal_keluar: data.tanggal_keluar
        ? new Date(data.tanggal_keluar)
        : undefined,
      keterangan: data.keterangan,
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

    await updateBarangKeluar(id, {
      id_merch: data.id_merch,
      id_stasiun: data.id_stasiun,
      id_kategori: data.id_kategori,
      jumlah: data.jumlah,
      tanggal_keluar: new Date(data.tanggal_keluar),
      keterangan: data.keterangan,
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

    await deleteBarangKeluar(id);
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
