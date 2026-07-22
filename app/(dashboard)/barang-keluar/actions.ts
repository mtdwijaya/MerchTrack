"use server";

import { revalidatePath } from "next/cache";

import { parseFormDateWithNowTime } from "@/lib/relative-time";

import { requireActionUser } from "@/lib/auth";
import { assertCanMutateBarangKeluar } from "@/lib/barang-keluar-access";
import { createBarangKembali, createBarangKembaliBatch } from "@/lib/barang-kembali";
import {
  createBarangKeluar,
  createBarangKeluarBatch,
  deleteBarangKeluar,
  getBarangKeluarByGrup,
  getBarangKeluarById,
  updateBarangKeluar,
  updateBarangKeluarBatch,
} from "@/lib/barang-keluar";
import { getBarangKeluarDetailPayload } from "@/lib/barang-keluar-detail";
import { buildEditActivityPesan, buildEditChangeSummary } from "@/lib/edit-activity-summary";
import { formatTransaksiId } from "@/lib/format-transaksi";
import { logEditAktivitas } from "@/lib/log-aktivitas";
import { prisma } from "@/lib/prisma";
import type { BarangKeluarWithRelations } from "@/lib/barang-keluar-types";
import { revalidateMerchandiseListCache } from "@/lib/merchandise";
import { revalidateAnalyticsPages } from "@/lib/revalidate-analytics";
import {
  getTanggalFromForm,
  isBarangKeluarBatchData,
  isBarangKeluarEditBatchData,
  parseBarangKeluarBukti,
  parseBarangKeluarFormData,
} from "@/lib/parse-transaksi-form";
import { getTujuanById } from "@/lib/tujuan";
import {
  barangKembaliBatchSchema,
  barangKembaliSchema,
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

  const allItems: BarangKeluarWithRelations[] = data.id_grup
    ? await getBarangKeluarByGrup(data.id_grup)
    : [data];

  const first = allItems[0];
  const hasReturns = allItems.some((item) => item.jumlah_kembali > 0);

  return {
    id_tujuan: first.id_tujuan,
    id_stasiun: first.id_stasiun ?? 0,
    id_unit: first.id_unit ?? 0,
    detail_teks: first.detail_teks ?? "",
    tanggal_keluar: first.tanggal_keluar.toISOString(),
    keterangan: first.keterangan ?? "",
    bukti_path: first.bukti_path,
    bukti_nama: first.bukti_nama,
    jumlah_kembali: hasReturns ? 1 : 0,
    items: allItems.map((item) => ({
      id_keluar: item.id_keluar,
      id_merch: item.id_merch,
      jumlah: item.jumlah,
      jumlah_kembali: item.jumlah_kembali,
    })),
  };
}

export async function getBarangKeluarReturnInfo(id: number) {
  const auth = await requireActionUser();
  if (!auth.ok) return null;

  const idParsed = parseSchema(idParamSchema, id);
  if (!idParsed.ok) return null;

  const data = await getBarangKeluarById(idParsed.data);
  if (!data) return null;

  return {
    id_keluar: data.id_keluar,
    merchandise: data.merchandise.nama_merch,
    tujuan: data.tujuan.nama_tujuan,
    jumlah: data.jumlah + data.jumlah_kembali,
    jumlah_kembali: data.jumlah_kembali,
    sisa: data.jumlah,
    status: data.status,
  };
}

/** Info pengembalian untuk seluruh grup transaksi (multi-merch) */
export async function getBarangKeluarGroupReturnInfo(id: number) {
  const auth = await requireActionUser();
  if (!auth.ok) return null;

  const idParsed = parseSchema(idParamSchema, id);
  if (!idParsed.ok) return null;

  const anchor = await getBarangKeluarById(idParsed.data);
  if (!anchor) return null;

  const groupItems = anchor.id_grup
    ? await getBarangKeluarByGrup(anchor.id_grup)
    : [anchor];

  if (!anchor.tujuan.boleh_return) {
    return {
      tujuan: anchor.tujuan.nama_tujuan,
      boleh_return: false,
      items: [] as {
        id_keluar: number;
        merchandise: string;
        jumlah: number;
        jumlah_kembali: number;
        sisa: number;
        status: (typeof anchor)["status"];
      }[],
    };
  }

  const items = groupItems
    .map((row) => ({
      id_keluar: row.id_keluar,
      merchandise: row.merchandise.nama_merch,
      jumlah: row.jumlah + row.jumlah_kembali,
      jumlah_kembali: row.jumlah_kembali,
      sisa: row.jumlah,
      status: row.status,
    }))
    .filter((row) => row.sisa > 0);

  return {
    tujuan: anchor.tujuan.nama_tujuan,
    boleh_return: true,
    items,
  };
}

export async function getBarangKeluarDetail(id: number) {
  const auth = await requireActionUser();
  if (!auth.ok) return null;

  const idParsed = parseSchema(idParamSchema, id);
  if (!idParsed.ok) return null;

  return getBarangKeluarDetailPayload(idParsed.data);
}

export async function createBarangKeluarAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const auth = await requireActionUser();
    if (!auth.ok) return auth;

    const parsed = parseBarangKeluarFormData(formData);
    if (!parsed.ok) return parsed;

    const bukti = await parseBarangKeluarBukti(formData);

    if (isBarangKeluarBatchData(parsed.data)) {
      await createBarangKeluarBatch({
        id_tujuan: parsed.data.id_tujuan,
        id_stasiun: parsed.data.id_stasiun,
        id_unit: parsed.data.id_unit,
        detail_teks: parsed.data.detail_teks,
        id_user: auth.user.id_user,
        items: parsed.data.items,
        tanggal_keluar: getTanggalFromForm(parsed.data.tanggal_keluar),
        keterangan: parsed.data.keterangan,
        bukti_path: bukti?.bukti_path ?? null,
        bukti_nama: bukti?.bukti_nama ?? null,
      });
    } else {
      await createBarangKeluar({
        id_merch: parsed.data.id_merch,
        id_tujuan: parsed.data.id_tujuan,
        id_stasiun: parsed.data.id_stasiun,
        id_unit: parsed.data.id_unit,
        detail_teks: parsed.data.detail_teks,
        id_user: auth.user.id_user,
        jumlah: parsed.data.jumlah,
        tanggal_keluar: getTanggalFromForm(parsed.data.tanggal_keluar),
        keterangan: parsed.data.keterangan,
        bukti_path: bukti?.bukti_path ?? null,
        bukti_nama: bukti?.bukti_nama ?? null,
      });
    }

    revalidatePath("/barang-keluar");
    revalidatePath("/laporan");
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
  formData: FormData
): Promise<ActionResult> {
  try {
    const auth = await requireActionUser();
    if (!auth.ok) return auth;

    const idParsed = parseSchema(idParamSchema, id);
    if (!idParsed.ok) return idParsed;

    const parsed = parseBarangKeluarFormData(formData);
    if (!parsed.ok) return parsed;

    const bukti = await parseBarangKeluarBukti(formData);

    if (isBarangKeluarEditBatchData(parsed.data)) {
      if (!parsed.data.tanggal_keluar) {
        return { ok: false, message: "Tanggal keluar wajib diisi" };
      }

      const existing = await getBarangKeluarById(idParsed.data);
      if (!existing) {
        return { ok: false, message: "Transaksi tidak ditemukan" };
      }

      assertCanMutateBarangKeluar(auth.user, existing);

      await updateBarangKeluarBatch(
        idParsed.data,
        {
          id_tujuan: parsed.data.id_tujuan,
          id_stasiun: parsed.data.id_stasiun,
          id_unit: parsed.data.id_unit,
          detail_teks: parsed.data.detail_teks,
          tanggal_keluar: getTanggalFromForm(parsed.data.tanggal_keluar),
          keterangan: parsed.data.keterangan,
          items: parsed.data.items,
        },
        bukti ?? undefined
      );

      revalidatePath("/barang-keluar");
      revalidatePath("/laporan");
      revalidatePath("/riwayat-transaksi");
      revalidateMerchandiseListCache();
      revalidateAnalyticsPages();
      return { ok: true };
    }

    if (isBarangKeluarBatchData(parsed.data)) {
      return {
        ok: false,
        message: "Format edit transaksi tidak valid",
      };
    }

    if (!parsed.data.tanggal_keluar) {
      return { ok: false, message: "Tanggal keluar wajib diisi" };
    }

    const existing = await getBarangKeluarById(idParsed.data);
    if (!existing) {
      return { ok: false, message: "Transaksi tidak ditemukan" };
    }

    assertCanMutateBarangKeluar(auth.user, existing);

    const tanggalBaru =
      getTanggalFromForm(parsed.data.tanggal_keluar) ?? existing.tanggal_keluar;

    const needsMerch = parsed.data.id_merch !== existing.id_merch;
    const needsTujuan = parsed.data.id_tujuan !== existing.id_tujuan;
    const needsStasiun =
      (parsed.data.id_stasiun ?? null) !== existing.id_stasiun;
    const needsUnit = (parsed.data.id_unit ?? null) !== existing.id_unit;

    const [newMerch, newTujuan, newStasiun, newUnit] = await Promise.all([
      needsMerch
        ? prisma.merchandise.findUnique({
            where: { id_merch: parsed.data.id_merch },
            select: { nama_merch: true },
          })
        : null,
      needsTujuan ? getTujuanById(parsed.data.id_tujuan) : null,
      needsStasiun && parsed.data.id_stasiun
        ? prisma.stasiun.findUnique({
            where: { id_stasiun: parsed.data.id_stasiun },
            select: { nama_stasiun: true },
          })
        : null,
      needsUnit && parsed.data.id_unit
        ? prisma.unit.findUnique({
            where: { id_unit: parsed.data.id_unit },
            select: { nama_unit: true },
          })
        : null,
    ]);

    const editChanges = buildEditChangeSummary(
      existing,
      {
        id_merch: parsed.data.id_merch,
        id_tujuan: parsed.data.id_tujuan,
        id_stasiun: parsed.data.id_stasiun,
        id_unit: parsed.data.id_unit,
        detail_teks: parsed.data.detail_teks,
        jumlah: parsed.data.jumlah,
        tanggal_keluar: tanggalBaru,
        keterangan: parsed.data.keterangan,
        buktiBaru: !!bukti,
      },
      {
        merchandise: newMerch?.nama_merch,
        tujuan: newTujuan ?? undefined,
        stasiun: needsStasiun ? newStasiun : existing.stasiun,
        unit: needsUnit ? newUnit : existing.unit,
      }
    );

    await updateBarangKeluar(idParsed.data, {
      id_merch: parsed.data.id_merch,
      id_tujuan: parsed.data.id_tujuan,
      id_stasiun: parsed.data.id_stasiun,
      id_unit: parsed.data.id_unit,
      detail_teks: parsed.data.detail_teks,
      jumlah: parsed.data.jumlah,
      tanggal_keluar: getTanggalFromForm(parsed.data.tanggal_keluar),
      keterangan: parsed.data.keterangan,
      ...(bukti
        ? {
            bukti_path: bukti.bukti_path,
            bukti_nama: bukti.bukti_nama,
          }
        : {}),
    });

    const displayMerch =
      newMerch?.nama_merch ?? existing.merchandise.nama_merch;

    if (editChanges.length > 0) {
      const editTime = new Date();
      await logEditAktivitas({
        id_keluar: existing.id_keluar,
        id_user: auth.user.id_user,
        occurredAt: editTime,
        pesan: buildEditActivityPesan(
          auth.user.nama_user,
          formatTransaksiId(existing.id_keluar),
          displayMerch,
          editChanges,
          editTime
        ),
      });
    }

    revalidatePath("/barang-keluar");
    revalidatePath("/laporan");
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

export async function returnBarangKeluarAction(
  id: number,
  data: {
    jumlah_kembali: number;
    tanggal_kembali: string;
    pengembali: string;
    asal: string;
    keterangan: string;
  }
): Promise<ActionResult> {
  try {
    const auth = await requireActionUser();
    if (!auth.ok) return auth;

    const idParsed = parseSchema(idParamSchema, id);
    if (!idParsed.ok) return idParsed;

    const parsed = parseSchema(barangKembaliSchema, data);
    if (!parsed.ok) return parsed;

    const keluar = await getBarangKeluarById(idParsed.data);
    if (!keluar) {
      return { ok: false, message: "Transaksi tidak ditemukan" };
    }

    assertCanMutateBarangKeluar(auth.user, keluar);

    const tanggalKembali = parsed.data.tanggal_kembali
      ? parseFormDateWithNowTime(parsed.data.tanggal_kembali)
      : new Date();

    await createBarangKembali({
      id_keluar: idParsed.data,
      id_user: auth.user.id_user,
      jumlah_kembali: parsed.data.jumlah_kembali,
      tanggal_kembali: tanggalKembali,
      pengembali: parsed.data.pengembali,
      asal: parsed.data.asal,
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

export async function returnBarangKeluarBatchAction(data: {
  tanggal_kembali: string;
  pengembali: string;
  asal: string;
  keterangan: string;
  items: { id_keluar: number; jumlah_kembali: number }[];
}): Promise<ActionResult> {
  try {
    const auth = await requireActionUser();
    if (!auth.ok) return auth;

    const parsed = parseSchema(barangKembaliBatchSchema, data);
    if (!parsed.ok) return parsed;

    const aktif = parsed.data.items.filter((item) => item.jumlah_kembali > 0);

    for (const item of aktif) {
      const keluar = await getBarangKeluarById(item.id_keluar);
      if (!keluar) {
        return {
          ok: false,
          message: `Transaksi #${item.id_keluar} tidak ditemukan`,
        };
      }
      assertCanMutateBarangKeluar(auth.user, keluar);
    }

    const tanggalKembali = parsed.data.tanggal_kembali
      ? parseFormDateWithNowTime(parsed.data.tanggal_kembali)
      : new Date();

    await createBarangKembaliBatch(
      auth.user.id_user,
      {
        tanggal_kembali: tanggalKembali,
        pengembali: parsed.data.pengembali,
        asal: parsed.data.asal,
        keterangan: parsed.data.keterangan,
      },
      aktif
    );

    revalidatePath("/barang-keluar");
    revalidatePath("/monitoring");
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

    const existing = await getBarangKeluarById(idParsed.data);
    if (!existing) {
      return { ok: false, message: "Transaksi tidak ditemukan" };
    }

    assertCanMutateBarangKeluar(auth.user, existing);

    await deleteBarangKeluar(idParsed.data);
    revalidatePath("/barang-keluar");
    revalidatePath("/laporan");
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
