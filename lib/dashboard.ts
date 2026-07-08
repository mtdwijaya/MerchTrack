import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";

import { ANALYTICS_CACHE_TAG } from "@/lib/analytics-cache-tag";
import {
  clampDashboardPeriod,
  MONTH_FULL,
  MONTH_SHORT,
} from "@/lib/dashboard-constants";
import type { DashboardData } from "@/lib/dashboard-types";
import { prisma } from "@/lib/prisma";

function periodRange(month: number, year: number) {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

function previousPeriod(month: number, year: number) {
  if (month === 1) return { month: 12, year: year - 1 };
  return { month: month - 1, year };
}

function dayRangeForMonth(month: number, year: number, day: number) {
  const start = new Date(year, month - 1, day, 0, 0, 0, 0);
  const end = new Date(year, month - 1, day, 23, 59, 59, 999);
  return { start, end };
}

function buildMonthlyTrend(
  records: { tanggal_keluar: Date; jumlah: number }[],
  selectedMonth: number,
  year: number
) {
  const buckets = Array.from({ length: 12 }, (_, month) => ({
    label: MONTH_SHORT[month],
    total: 0,
    isCurrent: month + 1 === selectedMonth,
  }));

  for (const item of records) {
    const date = new Date(item.tanggal_keluar);
    if (date.getFullYear() === year) {
      buckets[date.getMonth()].total += item.jumlah;
    }
  }

  return buckets;
}

async function fetchDashboardData(month: number, year: number) {
  const selected = periodRange(month, year);
  const prev = previousPeriod(month, year);
  const previous = periodRange(prev.month, prev.year);

  const now = new Date();
  const isCurrentMonth =
    month === now.getMonth() + 1 && year === now.getFullYear();
  const today = isCurrentMonth
    ? dayRangeForMonth(month, year, now.getDate())
    : null;
  const yesterday = isCurrentMonth
    ? dayRangeForMonth(month, year, now.getDate() - 1)
    : null;

  const monthWhere: Prisma.BarangKeluarWhereInput = {
    tanggal_keluar: { gte: selected.start, lte: selected.end },
  };
  const lastMonthWhere: Prisma.BarangKeluarWhereInput = {
    tanggal_keluar: { gte: previous.start, lte: previous.end },
  };
  const yearWhere: Prisma.BarangKeluarWhereInput = {
    tanggal_keluar: {
      gte: new Date(year, 0, 1, 0, 0, 0, 0),
      lte: new Date(year, 11, 31, 23, 59, 59, 999),
    },
  };

  const [
    totalStockAgg,
    masukBulanIniAgg,
    keluarBulanIniAgg,
    masukBulanLaluAgg,
    keluarBulanLaluAgg,
    topMerchBulanIni,
    transaksiMasukBulanIni,
    transaksiKeluarBulanIni,
    transaksiMasukBulanLalu,
    transaksiKeluarBulanLalu,
    distribusiHariIniAgg,
    distribusiKemarinAgg,
    peringatanStokRendah,
    stokRendah,
    top5MerchBulanIniGroup,
    tujuanGroup,
    trendYearRecords,
    stokGudang,
  ] = await Promise.all([
    prisma.stok.aggregate({ _sum: { jumlah_stok: true } }),
    prisma.barangMasuk.aggregate({
      where: {
        tanggal_masuk: { gte: selected.start, lte: selected.end },
      },
      _sum: { jumlah: true },
    }),
    prisma.barangKeluar.aggregate({
      where: monthWhere,
      _sum: { jumlah: true },
    }),
    prisma.barangMasuk.aggregate({
      where: {
        tanggal_masuk: { gte: previous.start, lte: previous.end },
      },
      _sum: { jumlah: true },
    }),
    prisma.barangKeluar.aggregate({
      where: lastMonthWhere,
      _sum: { jumlah: true },
    }),
    prisma.barangKeluar.groupBy({
      by: ["id_merch"],
      where: monthWhere,
      _sum: { jumlah: true },
      orderBy: { _sum: { jumlah: "desc" } },
      take: 1,
    }),
    prisma.barangMasuk.count({
      where: {
        tanggal_masuk: { gte: selected.start, lte: selected.end },
      },
    }),
    prisma.barangKeluar.count({ where: monthWhere }),
    prisma.barangMasuk.count({
      where: {
        tanggal_masuk: { gte: previous.start, lte: previous.end },
      },
    }),
    prisma.barangKeluar.count({ where: lastMonthWhere }),
    today
      ? prisma.barangKeluar.aggregate({
          where: {
            tanggal_keluar: { gte: today.start, lte: today.end },
          },
          _sum: { jumlah: true },
        })
      : Promise.resolve({ _sum: { jumlah: 0 } }),
    yesterday
      ? prisma.barangKeluar.aggregate({
          where: {
            tanggal_keluar: { gte: yesterday.start, lte: yesterday.end },
          },
          _sum: { jumlah: true },
        })
      : Promise.resolve({ _sum: { jumlah: 0 } }),
    prisma.stok.count({ where: { jumlah_stok: { gt: 0, lte: 50 } } }),
    prisma.stok.findMany({
      where: { jumlah_stok: { gt: 0, lte: 50 } },
      include: { merchandise: true },
      orderBy: { jumlah_stok: "asc" },
      take: 3,
    }),
    prisma.barangKeluar.groupBy({
      by: ["id_merch"],
      where: monthWhere,
      _sum: { jumlah: true },
      orderBy: { _sum: { jumlah: "desc" } },
      take: 5,
    }),
    prisma.barangKeluar.groupBy({
      by: ["id_tujuan"],
      where: monthWhere,
      _sum: { jumlah: true },
      orderBy: { _sum: { jumlah: "desc" } },
    }),
    prisma.barangKeluar.findMany({
      where: yearWhere,
      select: { tanggal_keluar: true, jumlah: true },
    }),
    prisma.stok.findMany({
      include: { merchandise: true },
      orderBy: { jumlah_stok: "desc" },
    }),
  ]);

  const totalStok = totalStockAgg._sum.jumlah_stok ?? 0;
  const masukBulanIni = masukBulanIniAgg._sum.jumlah ?? 0;
  const keluarBulanIni = keluarBulanIniAgg._sum.jumlah ?? 0;
  const masukBulanLalu = masukBulanLaluAgg._sum.jumlah ?? 0;
  const keluarBulanLalu = keluarBulanLaluAgg._sum.jumlah ?? 0;
  const distribusiHariIni = distribusiHariIniAgg._sum.jumlah ?? 0;
  const distribusiKemarin = distribusiKemarinAgg._sum.jumlah ?? 0;

  const netStokBulanIni = masukBulanIni - keluarBulanIni;
  const netStokBulanLalu = masukBulanLalu - keluarBulanLalu;

  const merchIds = [
    ...new Set([
      ...topMerchBulanIni.map((item) => item.id_merch),
      ...top5MerchBulanIniGroup.map((item) => item.id_merch),
    ]),
  ];
  const tujuanIds = tujuanGroup.map((item) => item.id_tujuan);

  const [merchandiseRecords, tujuanRecords, topMerchRecord] =
    await Promise.all([
      merchIds.length > 0
        ? prisma.merchandise.findMany({
            where: { id_merch: { in: merchIds } },
          })
        : Promise.resolve([]),
      tujuanIds.length > 0
        ? prisma.tujuan.findMany({
            where: { id_tujuan: { in: tujuanIds } },
          })
        : Promise.resolve([]),
      topMerchBulanIni[0]
        ? prisma.merchandise.findUnique({
            where: { id_merch: topMerchBulanIni[0].id_merch },
            select: { nama_merch: true },
          })
        : Promise.resolve(null),
    ]);

  const merchMap = new Map(
    merchandiseRecords.map((item) => [item.id_merch, item.nama_merch])
  );
  const tujuanMap = new Map(
    tujuanRecords.map((item) => [item.id_tujuan, item.nama_tujuan])
  );

  const topMerchQty = topMerchBulanIni[0]?._sum.jumlah ?? 0;
  const totalTransaksiBulanIni =
    transaksiMasukBulanIni + transaksiKeluarBulanIni;
  const totalTransaksiBulanLalu =
    transaksiMasukBulanLalu + transaksiKeluarBulanLalu;

  const selectedMonthName = MONTH_FULL[month - 1];
  const prevMonthName = MONTH_FULL[prev.month - 1];

  return {
    totalStokTersedia: totalStok,
    totalStokDelta: netStokBulanIni - netStokBulanLalu,
    totalBarangKeluarBulanIni: keluarBulanIni,
    barangKeluarDelta: keluarBulanIni - keluarBulanLalu,
    merchandiseTerbanyak: topMerchRecord?.nama_merch ?? null,
    merchandiseTerbanyakQty: topMerchQty,
    transaksiBulanIni: {
      masuk: transaksiMasukBulanIni,
      keluar: transaksiKeluarBulanIni,
      total: totalTransaksiBulanIni,
      delta: totalTransaksiBulanIni - totalTransaksiBulanLalu,
    },
    distribusiHariIni,
    distribusiHariIniDelta: distribusiHariIni - distribusiKemarin,
    peringatanStokRendah,
    stokRendahItems: stokRendah.map((item) => ({
      nama: item.merchandise.nama_merch,
      jumlah: item.jumlah_stok,
    })),
    trendDistribusi: buildMonthlyTrend(trendYearRecords, month, year),
    top5Merchandise: top5MerchBulanIniGroup.map((item) => ({
      nama: merchMap.get(item.id_merch) ?? "Merchandise",
      total: item._sum.jumlah ?? 0,
    })),
    penggunaanTujuan: tujuanGroup.map((item) => ({
      nama: tujuanMap.get(item.id_tujuan) ?? "Tujuan",
      total: item._sum.jumlah ?? 0,
    })),
    stokGudang: stokGudang.map((item) => ({
      id: item.id_stok,
      nama: item.merchandise.nama_merch,
      stok: item.jumlah_stok,
    })),
    chartMeta: {
      bulan: selectedMonthName,
      tahun: year,
      bulanLalu: prevMonthName,
      selectedMonth: month,
      selectedYear: year,
    },
  };
}

const getCachedDashboardData = unstable_cache(
  async (month: number, year: number) => fetchDashboardData(month, year),
  ["dashboard-data"],
  { tags: [ANALYTICS_CACHE_TAG], revalidate: 60 }
);

export async function getDashboardData(month: number, year: number): Promise<DashboardData> {
  const { month: safeMonth, year: safeYear } = clampDashboardPeriod(month, year);
  return getCachedDashboardData(safeMonth, safeYear);
}

export type { DashboardData } from "@/lib/dashboard-types";
