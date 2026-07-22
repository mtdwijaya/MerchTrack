import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";

import { ANALYTICS_CACHE_TAG } from "@/lib/analytics-cache-tag";
import {
  clampDashboardPeriod,
  MONTH_SHORT,
} from "@/lib/dashboard-constants";
import type { DashboardData } from "@/lib/dashboard-types";
import { lowStockWhere } from "@/lib/monitoring";
import { prisma } from "@/lib/prisma";

function periodRange(month: number, year: number) {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

function dayRange(dayOffset = 0) {
  const now = new Date();
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + dayOffset,
    0,
    0,
    0,
    0
  );
  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + dayOffset,
    23,
    59,
    59,
    999
  );
  return { start, end };
}

export type DashboardChartFilters = {
  chartYear: number;
  /** null = all-time untuk sankey */
  sankeyMonth: number | null;
  sankeyYear: number | null;
};

async function fetchDashboardData(
  chartYear: number,
  sankeyMonth: number | null,
  sankeyYear: number | null
): Promise<DashboardData> {
  const yearStart = new Date(chartYear, 0, 1, 0, 0, 0, 0);
  const yearEnd = new Date(chartYear, 11, 31, 23, 59, 59, 999);
  const today = dayRange(0);
  const yesterday = dayRange(-1);

  const sankeyAllTime = sankeyMonth == null || sankeyYear == null;
  let sankeyWhere: Prisma.BarangKeluarWhereInput = {};
  if (!sankeyAllTime && sankeyMonth != null && sankeyYear != null) {
    const range = periodRange(sankeyMonth, sankeyYear);
    sankeyWhere = {
      tanggal_keluar: { gte: range.start, lte: range.end },
    };
  }

  const [
    totalStockAgg,
    totalKeluarAgg,
    topMerchAllTime,
    transaksiMasuk,
    transaksiKeluar,
    distribusiHariIniAgg,
    distribusiKemarinAgg,
    peringatanStokRendah,
    stokRendah,
    top5Merch,
    sankeyGroup,
    trendYearRecords,
    stokGudang,
  ] = await Promise.all([
    prisma.stok.aggregate({ _sum: { jumlah_stok: true } }),
    prisma.barangKeluar.aggregate({ _sum: { jumlah: true } }),
    prisma.barangKeluar.groupBy({
      by: ["id_merch"],
      _sum: { jumlah: true },
      orderBy: { _sum: { jumlah: "desc" } },
      take: 1,
    }),
    prisma.barangMasuk.count(),
    prisma.$queryRaw<{ total: number }[]>`
      SELECT COUNT(DISTINCT COALESCE("id_grup", 'single:' || "id_keluar"::text))::int AS total
      FROM "BarangKeluar"
    `,
    prisma.barangKeluar.aggregate({
      where: { tanggal_keluar: { gte: today.start, lte: today.end } },
      _sum: { jumlah: true },
    }),
    prisma.barangKeluar.aggregate({
      where: {
        tanggal_keluar: { gte: yesterday.start, lte: yesterday.end },
      },
      _sum: { jumlah: true },
    }),
    prisma.stok.count({ where: lowStockWhere }),
    prisma.stok.findMany({
      where: lowStockWhere,
      include: { merchandise: true },
      orderBy: { jumlah_stok: "asc" },
      take: 3,
    }),
    prisma.barangKeluar.groupBy({
      by: ["id_merch"],
      _sum: { jumlah: true },
      orderBy: { _sum: { jumlah: "desc" } },
      take: 5,
    }),
    prisma.barangKeluar.groupBy({
      by: ["id_merch", "id_tujuan"],
      where: sankeyWhere,
      _sum: { jumlah: true },
      orderBy: { _sum: { jumlah: "desc" } },
    }),
    prisma.barangKeluar.findMany({
      where: {
        tanggal_keluar: { gte: yearStart, lte: yearEnd },
      },
      select: {
        tanggal_keluar: true,
        jumlah: true,
        id_merch: true,
      },
    }),
    prisma.stok.findMany({
      include: { merchandise: true },
      orderBy: { jumlah_stok: "desc" },
    }),
  ]);

  const merchIds = [
    ...new Set([
      ...topMerchAllTime.map((item) => item.id_merch),
      ...top5Merch.map((item) => item.id_merch),
      ...sankeyGroup.map((item) => item.id_merch),
      ...trendYearRecords.map((item) => item.id_merch),
    ]),
  ];
  const tujuanIds = [...new Set(sankeyGroup.map((item) => item.id_tujuan))];

  const [merchandiseRecords, tujuanRecords, topMerchRecord] =
    await Promise.all([
      merchIds.length > 0
        ? prisma.merchandise.findMany({
            where: { id_merch: { in: merchIds } },
            select: { id_merch: true, nama_merch: true },
          })
        : Promise.resolve([]),
      tujuanIds.length > 0
        ? prisma.tujuan.findMany({
            where: { id_tujuan: { in: tujuanIds } },
            select: { id_tujuan: true, nama_tujuan: true },
          })
        : Promise.resolve([]),
      topMerchAllTime[0]
        ? prisma.merchandise.findUnique({
            where: { id_merch: topMerchAllTime[0].id_merch },
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

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const transaksiPerBulan = Array.from({ length: 12 }, (_, month) => ({
    label: MONTH_SHORT[month],
    month: month + 1,
    byMerchandise: {} as Record<string, number>,
    isCurrent: chartYear === currentYear && month + 1 === currentMonth,
  }));

  for (const row of trendYearRecords) {
    const date = new Date(row.tanggal_keluar);
    if (date.getFullYear() !== chartYear) continue;
    const bucket = transaksiPerBulan[date.getMonth()];
    const nama = merchMap.get(row.id_merch) ?? "Merchandise";
    bucket.byMerchandise[nama] =
      (bucket.byMerchandise[nama] ?? 0) + row.jumlah;
  }

  const sankeyLinks = sankeyGroup
    .map((item) => ({
      source: merchMap.get(item.id_merch) ?? "Merchandise",
      target: tujuanMap.get(item.id_tujuan) ?? "Tujuan",
      value: item._sum.jumlah ?? 0,
    }))
    .filter((link) => link.value > 0);

  return {
    totalStokTersedia: totalStockAgg._sum.jumlah_stok ?? 0,
    totalBarangKeluar: totalKeluarAgg._sum.jumlah ?? 0,
    merchandiseTerbanyak: topMerchRecord?.nama_merch ?? null,
    merchandiseTerbanyakQty: topMerchAllTime[0]?._sum.jumlah ?? 0,
    totalTransaksi: {
      masuk: transaksiMasuk,
      keluar: transaksiKeluar[0]?.total ?? 0,
      total: transaksiMasuk + (transaksiKeluar[0]?.total ?? 0),
    },
    distribusiHariIni: distribusiHariIniAgg._sum.jumlah ?? 0,
    distribusiHariIniDelta:
      (distribusiHariIniAgg._sum.jumlah ?? 0) -
      (distribusiKemarinAgg._sum.jumlah ?? 0),
    peringatanStokRendah,
    stokRendahItems: stokRendah.map((item) => ({
      nama: item.merchandise.nama_merch,
      jumlah: item.jumlah_stok,
    })),
    topMerchandise: top5Merch.map((item) => ({
      nama: merchMap.get(item.id_merch) ?? "Merchandise",
      total: item._sum.jumlah ?? 0,
    })),
    transaksiPerBulan,
    sankeyLinks,
    stokGudang: stokGudang.map((item) => ({
      id: item.id_stok,
      nama: item.merchandise.nama_merch,
      stok: item.jumlah_stok,
    })),
    chartMeta: {
      chartYear,
      sankeyMonth: sankeyAllTime ? null : sankeyMonth,
      sankeyYear: sankeyAllTime ? null : sankeyYear,
      sankeyAllTime,
    },
  };
}

const getCachedDashboardData = unstable_cache(
  async (
    chartYear: number,
    sankeyMonth: number | null,
    sankeyYear: number | null
  ) => fetchDashboardData(chartYear, sankeyMonth, sankeyYear),
  ["dashboard-data-v2"],
  { tags: [ANALYTICS_CACHE_TAG], revalidate: 60 }
);

export async function getDashboardData(
  filters?: Partial<DashboardChartFilters>
): Promise<DashboardData> {
  const now = new Date();
  const chartYear = filters?.chartYear ?? now.getFullYear();
  const { year: safeYear } = clampDashboardPeriod(1, chartYear);

  const sankeyMonth =
    filters?.sankeyMonth == null || filters.sankeyMonth <= 0
      ? null
      : filters.sankeyMonth;
  const sankeyYear =
    filters?.sankeyYear == null || filters.sankeyYear <= 0
      ? null
      : filters.sankeyYear;

  return getCachedDashboardData(safeYear, sankeyMonth, sankeyYear);
}

export type { DashboardData } from "@/lib/dashboard-types";
