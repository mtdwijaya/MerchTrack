import { prisma } from "@/lib/prisma";
import {
  formatDetailTujuan,
  STATUS_BARANG_KELUAR_LABEL,
} from "@/lib/detail-tujuan";
import {
  recentBarangKeluarInclude,
  recentBarangMasukInclude,
} from "@/lib/prisma-selects";
import type { Prisma, StatusBarangKeluar } from "@prisma/client";

export type LaporanJenis = "keluar" | "masuk" | "semua";
export type LaporanPeriode = "1" | "7" | "30" | "custom" | "semua";

export type LaporanGenerateInput = {
  jenis: LaporanJenis;
  id_merch: number | null; // null = semua merchandise
  periode: LaporanPeriode;
  tanggal_dari?: string;
  tanggal_sampai?: string;
};

export type LaporanGenerateRow = {
  jenis: "KELUAR" | "MASUK";
  id: number;
  tanggal: string;
  merchandise: string;
  jumlah: number;
  jumlah_kembali?: number;
  terpakai?: number;
  tujuan?: string;
  detail_tujuan?: string;
  status?: string;
  petugas: string;
  keterangan: string | null;
};

export type LaporanGenerateResult = {
  generatedAt: string;
  filters: {
    jenisLabel: string;
    merchandiseLabel: string;
    periodeLabel: string;
    tanggalDari: string | null;
    tanggalSampai: string | null;
  };
  rows: LaporanGenerateRow[];
  summary: {
    totalRows: number;
    totalKeluarPcs: number;
    totalMasukPcs: number;
    totalKeluarTrx: number;
    totalMasukTrx: number;
  };
};

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function resolveDateRange(input: LaporanGenerateInput): {
  from: Date | null;
  to: Date | null;
  label: string;
} {
  const now = new Date();

  switch (input.periode) {
    case "1": {
      return {
        from: startOfDay(now),
        to: endOfDay(now),
        label: "Hari ini (1 hari)",
      };
    }
    case "7": {
      const from = startOfDay(now);
      from.setDate(from.getDate() - 6);
      return { from, to: endOfDay(now), label: "7 hari terakhir" };
    }
    case "30": {
      const from = startOfDay(now);
      from.setDate(from.getDate() - 29);
      return { from, to: endOfDay(now), label: "30 hari terakhir" };
    }
    case "custom": {
      if (!input.tanggal_dari || !input.tanggal_sampai) {
        throw new Error("Tanggal mulai dan tanggal akhir wajib diisi");
      }
      const from = startOfDay(new Date(input.tanggal_dari));
      const to = endOfDay(new Date(input.tanggal_sampai));
      if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
        throw new Error("Format tanggal tidak valid");
      }
      if (from > to) {
        throw new Error("Tanggal mulai tidak boleh lebih besar dari tanggal akhir");
      }
      return {
        from,
        to,
        label: `${input.tanggal_dari} s/d ${input.tanggal_sampai}`,
      };
    }
    case "semua":
    default:
      return { from: null, to: null, label: "Semua waktu" };
  }
}

function jenisLabel(jenis: LaporanJenis) {
  switch (jenis) {
    case "keluar":
      return "Barang Keluar";
    case "masuk":
      return "Barang Masuk";
    case "semua":
      return "Barang Keluar & Masuk";
  }
}

export async function generateLaporanData(
  input: LaporanGenerateInput
): Promise<LaporanGenerateResult> {
  const range = resolveDateRange(input);

  const merchWhere =
    input.id_merch != null ? { id_merch: input.id_merch } : {};

  const dateKeluarWhere: Prisma.BarangKeluarWhereInput =
    range.from && range.to
      ? { tanggal_keluar: { gte: range.from, lte: range.to } }
      : {};

  const dateMasukWhere: Prisma.BarangMasukWhereInput =
    range.from && range.to
      ? { tanggal_masuk: { gte: range.from, lte: range.to } }
      : {};

  let merchandiseLabel = "Semua merchandise";
  if (input.id_merch != null) {
    const merch = await prisma.merchandise.findUnique({
      where: { id_merch: input.id_merch },
      select: { nama_merch: true },
    });
    merchandiseLabel = merch?.nama_merch ?? `ID ${input.id_merch}`;
  }

  const includeKeluar =
    input.jenis === "keluar" || input.jenis === "semua";
  const includeMasuk = input.jenis === "masuk" || input.jenis === "semua";

  const [keluarRows, masukRows] = await Promise.all([
    includeKeluar
      ? prisma.barangKeluar.findMany({
          where: { ...merchWhere, ...dateKeluarWhere },
          include: recentBarangKeluarInclude,
          orderBy: { tanggal_keluar: "desc" },
          take: 5000,
        })
      : Promise.resolve([]),
    includeMasuk
      ? prisma.barangMasuk.findMany({
          where: { ...merchWhere, ...dateMasukWhere },
          include: recentBarangMasukInclude,
          orderBy: { tanggal_masuk: "desc" },
          take: 5000,
        })
      : Promise.resolve([]),
  ]);

  const rows: LaporanGenerateRow[] = [];

  for (const item of keluarRows) {
    const terpakai = item.jumlah;
    const dikembalikan = item.jumlah_kembali;
    const keluar = terpakai + dikembalikan;

    rows.push({
      jenis: "KELUAR",
      id: item.id_keluar,
      tanggal: item.tanggal_keluar.toISOString(),
      merchandise: item.merchandise.nama_merch,
      jumlah: keluar,
      jumlah_kembali: dikembalikan,
      terpakai,
      tujuan: item.tujuan.nama_tujuan,
      detail_tujuan: formatDetailTujuan(item),
      status:
        STATUS_BARANG_KELUAR_LABEL[item.status as StatusBarangKeluar] ??
        item.status,
      petugas: item.user.nama_user,
      keterangan: item.keterangan,
    });
  }

  for (const item of masukRows) {
    rows.push({
      jenis: "MASUK",
      id: item.id_masuk,
      tanggal: item.tanggal_masuk.toISOString(),
      merchandise: item.merchandise.nama_merch,
      jumlah: item.jumlah,
      petugas: item.user.nama_user,
      keterangan: item.keterangan,
    });
  }

  rows.sort(
    (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
  );

  const totalKeluarPcs = rows
    .filter((r) => r.jenis === "KELUAR")
    .reduce((sum, r) => sum + (r.terpakai ?? r.jumlah), 0);
  const totalMasukPcs = rows
    .filter((r) => r.jenis === "MASUK")
    .reduce((sum, r) => sum + r.jumlah, 0);

  return {
    generatedAt: new Date().toISOString(),
    filters: {
      jenisLabel: jenisLabel(input.jenis),
      merchandiseLabel,
      periodeLabel: range.label,
      tanggalDari: range.from?.toISOString() ?? null,
      tanggalSampai: range.to?.toISOString() ?? null,
    },
    rows,
    summary: {
      totalRows: rows.length,
      totalKeluarPcs,
      totalMasukPcs,
      totalKeluarTrx: rows.filter((r) => r.jenis === "KELUAR").length,
      totalMasukTrx: rows.filter((r) => r.jenis === "MASUK").length,
    },
  };
}
