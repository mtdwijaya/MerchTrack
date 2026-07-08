import type { StatusBarangKeluar } from "@prisma/client";

import { prisma } from "@/lib/prisma";

function resolveStatus(
  jumlah: number,
  jumlahKembali: number
): StatusBarangKeluar {
  if (jumlahKembali <= 0) return "AKTIF";
  if (jumlah <= 0) return "LUNAS_KEMBALI";
  return "SEBAGIAN_KEMBALI";
}

export async function createBarangKembali(data: {
  id_keluar: number;
  id_user: number;
  jumlah_kembali: number;
  tanggal_kembali?: Date;
  keterangan?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const transaksi = await tx.barangKeluar.findUnique({
      where: { id_keluar: data.id_keluar },
    });

    if (!transaksi) {
      throw new Error("Transaksi tidak ditemukan");
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
        keterangan: data.keterangan,
      },
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
  });
}

export async function getBarangKembaliByKeluarId(id_keluar: number) {
  return prisma.barangKembali.findMany({
    where: { id_keluar },
    include: {
      user: { select: { id_user: true, nama_user: true } },
    },
    orderBy: { tanggal_kembali: "desc" },
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
