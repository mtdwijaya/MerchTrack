import type { Role } from "@prisma/client";
import { unstable_cache } from "next/cache";

import { ANALYTICS_CACHE_TAG } from "@/lib/analytics-cache-tag";
import { getStockStatus } from "@/lib/monitoring";
import { prisma } from "@/lib/prisma";
import { riwayatListInclude } from "@/lib/prisma-selects";

export type MonitoringUser = {
  id_user: number;
  id_stasiun: number | null;
  role: Role;
};

function monthRange(offset = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59, 59);
  return { start, end };
}

async function fetchMonitoringOverview(role: Role) {
  const thisMonth = monthRange(0);

  const [
    totalStokAktifAgg,
    tujuanAktifGroup,
    distribusiBulanIniAgg,
    peringatanStokRendah,
    merchGroupThisMonth,
    stokRendah,
    merchandiseStock,
  ] = await Promise.all([
    prisma.stok.aggregate({ _sum: { jumlah_stok: true } }),
    prisma.barangKeluar.groupBy({ by: ["id_tujuan"] }),
    prisma.barangKeluar.aggregate({
      where: { tanggal_keluar: { gte: thisMonth.start, lte: thisMonth.end } },
      _sum: { jumlah: true },
    }),
    prisma.stok.count({ where: { jumlah_stok: { gt: 0, lte: 50 } } }),
    prisma.barangKeluar.groupBy({
      by: ["id_merch"],
      where: { tanggal_keluar: { gte: thisMonth.start, lte: thisMonth.end } },
      _sum: { jumlah: true },
    }),
    prisma.stok.findMany({
      where: { jumlah_stok: { gt: 0, lte: 50 } },
      include: { merchandise: true },
      orderBy: { jumlah_stok: "asc" },
      take: 10,
    }),
    prisma.stok.findMany({
      include: { merchandise: true },
      orderBy: [{ jumlah_stok: "desc" }, { id_merch: "asc" }],
    }),
  ]);

  void role;

  const stockMap = new Map(
    merchandiseStock.map((item) => [item.id_merch, item.jumlah_stok])
  );

  const topMerchSorted = [...merchGroupThisMonth]
    .sort((a, b) => (b._sum.jumlah ?? 0) - (a._sum.jumlah ?? 0))
    .slice(0, 5);

  const topMerchIds = topMerchSorted.map((item) => item.id_merch);
  const merchRecords =
    topMerchIds.length > 0
      ? await prisma.merchandise.findMany({
          where: { id_merch: { in: topMerchIds } },
          select: { id_merch: true, nama_merch: true },
        })
      : [];

  const merchNameMap = new Map(
    merchRecords.map((item) => [item.id_merch, item.nama_merch])
  );

  const topMerchandise = topMerchSorted.map((item) => ({
    id_merch: item.id_merch,
    nama: merchNameMap.get(item.id_merch) ?? "Merchandise",
    total: item._sum.jumlah ?? 0,
    stokTersisa: stockMap.get(item.id_merch) ?? 0,
  }));

  return {
    summary: {
      totalStokAktif: totalStokAktifAgg._sum.jumlah_stok ?? 0,
      tujuanAktif: tujuanAktifGroup.length,
      distribusiBulanIni: distribusiBulanIniAgg._sum.jumlah ?? 0,
      peringatanStokRendah,
    },
    topMerchandise,
    merchandiseStock: merchandiseStock.map((item) => ({
      id_merch: item.id_merch,
      nama: item.merchandise.nama_merch,
      jumlah: item.jumlah_stok,
      status: getStockStatus(item.jumlah_stok),
    })),
    lowStockItems: stokRendah.map((item) => ({
      id_merch: item.id_merch,
      nama: item.merchandise.nama_merch,
      jumlah: item.jumlah_stok,
      status: getStockStatus(item.jumlah_stok),
    })),
  };
}

const getCachedMonitoringOverview = unstable_cache(
  fetchMonitoringOverview,
  ["monitoring-overview"],
  { tags: [ANALYTICS_CACHE_TAG], revalidate: 30 }
);

export async function getMonitoringOverview(user: MonitoringUser) {
  return getCachedMonitoringOverview(user.role);
}

export async function getMonitoringRecentTransactions() {
  return prisma.barangKeluar.findMany({
    take: 10,
    orderBy: { tanggal_keluar: "desc" },
    include: riwayatListInclude,
  });
}

// aktivitas terbaru dipindah ke lib/recent-activity.ts
export type MonitoringOverview = Awaited<ReturnType<typeof getMonitoringOverview>>;
export type MonitoringRecentTransactions = Awaited<
  ReturnType<typeof getMonitoringRecentTransactions>
>;
