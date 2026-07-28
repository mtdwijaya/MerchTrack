import type { StatusBarangKeluar } from "@prisma/client";

import type { BarangKembaliCreateData } from "@/lib/barang-kembali-types";
import { formatDetailTujuan } from "@/lib/detail-tujuan";
import { formatMerchandiseGroupLabel } from "@/lib/barang-keluar-group";
import { prisma } from "@/lib/prisma";

function resolveStatus(
  jumlah: number,
  jumlahKembali: number
): StatusBarangKeluar {
  if (jumlahKembali <= 0) return "AKTIF";
  if (jumlah <= 0) return "LUNAS_KEMBALI";
  return "SEBAGIAN_KEMBALI";
}

export async function createBarangKembali(data: BarangKembaliCreateData) {
  return prisma.$transaction(async (tx) => {
    return createBarangKembaliInTx(tx, data);
  });
}

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function createBarangKembaliInTx(
  tx: TxClient,
  data: BarangKembaliCreateData
) {
  const transaksi = await tx.barangKeluar.findUnique({
    where: { id_keluar: data.id_keluar },
    include: {
      tujuan: { select: { boleh_return: true } },
    },
  });

  if (!transaksi) {
    throw new Error("Transaksi tidak ditemukan");
  }

  if (!transaksi.tujuan.boleh_return) {
    throw new Error("Tujuan ini tidak mengizinkan pengembalian");
  }

  if (data.jumlah_kembali > transaksi.jumlah) {
    throw new Error(`Jumlah kembali melebihi sisa (${transaksi.jumlah} pcs)`);
  }

  const record = await tx.barangKembali.create({
    data: {
      id_keluar: data.id_keluar,
      id_user: data.id_user,
      jumlah_kembali: data.jumlah_kembali,
      tanggal_kembali: data.tanggal_kembali ?? new Date(),
      pengembali: data.pengembali,
      asal: data.asal,
      keterangan: data.keterangan,
    } as Parameters<typeof tx.barangKembali.create>[0]["data"],
  });

  const jumlahKembaliBaru = transaksi.jumlah_kembali + data.jumlah_kembali;
  const jumlahBaru = transaksi.jumlah - data.jumlah_kembali;

  await tx.barangKeluar.update({
    where: { id_keluar: data.id_keluar },
    data: {
      jumlah: jumlahBaru,
      jumlah_kembali: jumlahKembaliBaru,
      status: resolveStatus(jumlahBaru, jumlahKembaliBaru),
    },
  });

  await tx.stok.update({
    where: { id_merch: transaksi.id_merch },
    data: {
      jumlah_stok: { increment: data.jumlah_kembali },
    },
  });

  return record;
}

/** Satu transaksi DB untuk pengembalian beberapa merch dalam grup */
export async function createBarangKembaliBatch(
  id_user: number,
  shared: {
    tanggal_kembali?: Date;
    pengembali: string;
    asal: string;
    keterangan?: string;
  },
  items: { id_keluar: number; jumlah_kembali: number }[]
) {
  const aktif = items.filter((item) => item.jumlah_kembali > 0);
  if (aktif.length === 0) {
    throw new Error("Isi jumlah kembali minimal untuk satu merchandise");
  }

  return prisma.$transaction(async (tx) => {
    const results = [];
    for (const item of aktif) {
      results.push(
        await createBarangKembaliInTx(tx, {
          id_keluar: item.id_keluar,
          id_user,
          jumlah_kembali: item.jumlah_kembali,
          tanggal_kembali: shared.tanggal_kembali,
          pengembali: shared.pengembali,
          asal: shared.asal,
          keterangan: shared.keterangan,
        })
      );
    }
    return results;
  });
}

export async function getBarangKembaliByKeluarIds(ids: number[]) {
  if (ids.length === 0) return [];

  return prisma.barangKembali.findMany({
    where: { id_keluar: { in: ids } },
    include: {
      user: { select: { id_user: true, nama_user: true } },
      barangKeluar: {
        include: {
          merchandise: { select: { nama_merch: true } },
        },
      },
    },
    orderBy: [{ tanggal_kembali: "desc" }, { id_kembali: "desc" }],
  });
}

export type QuickReturnItem = {
  id_keluar: number;
  id_merch: number;
  nama_merch: string;
  foto_path: string | null;
  sisa: number;
  jumlah_awal: number;
  jumlah_kembali: number;
};

export type QuickReturnGroup = {
  group_key: string;
  id_keluar: number;
  id_grup: string | null;
  id_user: number;
  tanggal_keluar: string;
  tujuan: string;
  detail_tujuan: string;
  asal: string;
  merchandise_label: string;
  total_sisa: number;
  items: QuickReturnItem[];
};

/** Grup transaksi keluar yang masih bisa dikembalikan (untuk akses cepat). */
export async function listQuickReturnGroups(): Promise<QuickReturnGroup[]> {
  const rows = await prisma.barangKeluar.findMany({
    where: {
      jumlah: { gt: 0 },
      tujuan: { boleh_return: true },
    },
    select: {
      id_keluar: true,
      id_grup: true,
      id_user: true,
      id_merch: true,
      jumlah: true,
      jumlah_kembali: true,
      tanggal_keluar: true,
      detail_teks: true,
      merchandise: { select: { nama_merch: true, foto_path: true } },
      tujuan: {
        select: {
          nama_tujuan: true,
          jenis_detail: true,
        },
      },
      stasiun: { select: { nama_stasiun: true } },
      unit: { select: { nama_unit: true } },
    },
    orderBy: [{ tanggal_keluar: "desc" }, { id_keluar: "desc" }],
  });

  const map = new Map<
    string,
    {
      group_key: string;
      id_keluar: number;
      id_grup: string | null;
      id_user: number;
      tanggal_keluar: Date;
      tujuan: string;
      detail_tujuan: string;
      items: QuickReturnItem[];
    }
  >();

  for (const row of rows) {
    const groupKey = row.id_grup ?? `single:${row.id_keluar}`;
    const detail = formatDetailTujuan(row);
    const item: QuickReturnItem = {
      id_keluar: row.id_keluar,
      id_merch: row.id_merch,
      nama_merch: row.merchandise.nama_merch,
      foto_path: row.merchandise.foto_path,
      sisa: row.jumlah,
      jumlah_awal: row.jumlah + row.jumlah_kembali,
      jumlah_kembali: row.jumlah_kembali,
    };

    const existing = map.get(groupKey);
    if (!existing) {
      map.set(groupKey, {
        group_key: groupKey,
        id_keluar: row.id_keluar,
        id_grup: row.id_grup,
        id_user: row.id_user,
        tanggal_keluar: row.tanggal_keluar,
        tujuan: row.tujuan.nama_tujuan,
        detail_tujuan: detail,
        items: [item],
      });
      continue;
    }

    existing.items.push(item);
    if (row.id_keluar < existing.id_keluar) {
      existing.id_keluar = row.id_keluar;
      existing.id_user = row.id_user;
    }
    if (row.tanggal_keluar > existing.tanggal_keluar) {
      existing.tanggal_keluar = row.tanggal_keluar;
    }
  }

  return [...map.values()].map((group) => {
    const names = group.items.map((item) => item.nama_merch);
    const detail =
      group.detail_tujuan && group.detail_tujuan !== "-"
        ? group.detail_tujuan
        : group.tujuan;
    return {
      group_key: group.group_key,
      id_keluar: group.id_keluar,
      id_grup: group.id_grup,
      id_user: group.id_user,
      tanggal_keluar: group.tanggal_keluar.toISOString(),
      tujuan: group.tujuan,
      detail_tujuan: group.detail_tujuan,
      asal: detail,
      merchandise_label: formatMerchandiseGroupLabel(names),
      total_sisa: group.items.reduce((sum, item) => sum + item.sisa, 0),
      items: group.items,
    };
  });
}

/** Backfill riwayat jika jumlah_kembali ada tapi record BarangKembali belum tercatat */
export async function reconcileMissingBarangKembaliRecords(id_keluar: number) {
  const keluar = await prisma.barangKeluar.findUnique({
    where: { id_keluar },
    include: {
      merchandise: { select: { nama_merch: true } },
      user: { select: { id_user: true, nama_user: true } },
      _count: { select: { barangKembali: true } },
    },
  });

  if (
    !keluar ||
    keluar.jumlah_kembali <= 0 ||
    keluar._count.barangKembali > 0
  ) {
    return;
  }

  await prisma.barangKembali.create({
    data: {
      id_keluar,
      id_user: keluar.id_user,
      jumlah_kembali: keluar.jumlah_kembali,
      tanggal_kembali: keluar.tanggal_keluar,
      keterangan: "Rekonsiliasi data pengembalian",
    },
  });
}
