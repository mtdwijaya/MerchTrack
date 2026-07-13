import { unstable_cache } from "next/cache";

import { ANALYTICS_CACHE_TAG } from "@/lib/analytics-cache-tag";
import { getStockStatus, lowStockWhere } from "@/lib/monitoring";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

export type MonitoringUser = {
  id_user: number;
  id_stasiun: number | null;
  role: Role;
};

// hitung range tanggal bulan ini / bulan lalu (offset 0 = bulan ini)
function monthRange(offset = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59, 59);
  return { start, end };
}

async function fetchMonitoringOverview() {
  const thisMonth = monthRange(0);

  // semua query paralel biar load halaman monitoring cepet
  const [
    totalStokAktifAgg,
    totalMerchandise,
    distribusiBulanIniAgg,
    peringatanStokRendah,
    merchGroupThisMonth,
    stokRendah,
    merchandiseStock,
  ] = await Promise.all([
    prisma.stok.aggregate({ _sum: { jumlah_stok: true } }),
    prisma.merchandise.count(),
    prisma.barangKeluar.aggregate({
      where: { tanggal_keluar: { gte: thisMonth.start, lte: thisMonth.end } },
      _sum: { jumlah: true },
    }),
    // stok < 20 termasuk habis (0 pcs)
    prisma.stok.count({ where: lowStockWhere }),
    prisma.barangKeluar.groupBy({
      by: ["id_merch"],
      where: { tanggal_keluar: { gte: thisMonth.start, lte: thisMonth.end } },
      _sum: { jumlah: true },
    }),
    prisma.stok.findMany({
      where: lowStockWhere,
      include: { merchandise: true },
      orderBy: { jumlah_stok: "asc" },
      take: 10,
    }),
    prisma.stok.findMany({
      include: { merchandise: true },
      orderBy: [{ jumlah_stok: "desc" }, { id_merch: "asc" }],
      take: 48,
    }),
  ]);

  const stockMap = new Map(
    merchandiseStock.map((item) => [item.id_merch, item.jumlah_stok])
  );

  // top 5 merch paling banyak keluar bulan ini
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
      totalMerchandise,
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

// cache 30 detik — data monitoring ga perlu real-time banget
const getCachedMonitoringOverview = unstable_cache(
  fetchMonitoringOverview,
  ["monitoring-overview"],
  { tags: [ANALYTICS_CACHE_TAG], revalidate: 30 }
);

export async function getMonitoringOverview(_user: MonitoringUser) {
  return getCachedMonitoringOverview();
}

export type MonitoringOverview = Awaited<ReturnType<typeof getMonitoringOverview>>;
