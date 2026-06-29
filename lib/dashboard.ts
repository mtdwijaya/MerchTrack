import { unstable_cache } from "next/cache";

import { ANALYTICS_CACHE_TAG } from "@/lib/revalidate-analytics";
import { prisma } from "@/lib/prisma";

function monthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59
  );
  return { start, end };
}

async function fetchDashboardData() {
  const thisMonth = monthRange();

  const [
    merchandiseCount,
    stationCount,
    totalStockAgg,
    barangKeluarBulanIniAgg,
    merchGroup,
    stasiunGroup,
    stokGudang,
  ] = await Promise.all([
    prisma.merchandise.count(),
    prisma.stasiun.count(),
    prisma.stok.aggregate({ _sum: { jumlah_stok: true } }),
    prisma.barangKeluar.aggregate({
      where: {
        tanggal_keluar: { gte: thisMonth.start, lte: thisMonth.end },
      },
      _sum: { jumlah: true },
    }),
    prisma.barangKeluar.groupBy({
      by: ["id_merch"],
      _sum: { jumlah: true },
      orderBy: { _sum: { jumlah: "desc" } },
      take: 5,
    }),
    prisma.barangKeluar.groupBy({
      by: ["id_stasiun"],
      _sum: { jumlah: true },
      orderBy: { _sum: { jumlah: "desc" } },
    }),
    prisma.stok.findMany({
      include: { merchandise: true },
      orderBy: { jumlah_stok: "desc" },
      take: 8,
    }),
  ]);

  const merchIds = merchGroup.map((item) => item.id_merch);
  const stasiunIds = stasiunGroup.map((item) => item.id_stasiun);

  const [merchandiseRecords, stasiunRecords] = await Promise.all([
    merchIds.length > 0
      ? prisma.merchandise.findMany({
          where: { id_merch: { in: merchIds } },
        })
      : Promise.resolve([]),
    stasiunIds.length > 0
      ? prisma.stasiun.findMany({
          where: { id_stasiun: { in: stasiunIds } },
        })
      : Promise.resolve([]),
  ]);

  const merchMap = new Map(
    merchandiseRecords.map((item) => [item.id_merch, item.nama_merch])
  );
  const stasiunMap = new Map(
    stasiunRecords.map((item) => [item.id_stasiun, item.nama_stasiun])
  );

  return {
    totalMerchandise: merchandiseCount,
    totalStock: totalStockAgg._sum.jumlah_stok ?? 0,
    totalBarangKeluarBulanIni: barangKeluarBulanIniAgg._sum.jumlah ?? 0,
    totalStasiun: stationCount,
    topMerchandise: merchGroup.map((item) => ({
      nama: merchMap.get(item.id_merch) ?? "Merchandise",
      total: item._sum.jumlah ?? 0,
    })),
    distribusiPerStasiun: stasiunGroup.map((item) => ({
      nama: stasiunMap.get(item.id_stasiun) ?? "Stasiun",
      total: item._sum.jumlah ?? 0,
    })),
    stokGudang: stokGudang.map((item) => ({
      id: item.id_stok,
      nama: item.merchandise.nama_merch,
      stok: item.jumlah_stok,
    })),
  };
}

// cache data statistik — invalidasi lewat revalidateAnalyticsPages(), bukan export revalidate di page
export const getDashboardData = unstable_cache(
  fetchDashboardData,
  ["dashboard-data"],
  { tags: [ANALYTICS_CACHE_TAG], revalidate: 60 }
);

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
