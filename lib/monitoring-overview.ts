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

const merchandiseStockSelect = {
  nama_merch: true,
  foto_path: true,
} as const;

async function fetchMonitoringOverview() {
  const [
    totalStokAktifAgg,
    totalMerchandise,
    peringatanStokRendah,
    stokRendah,
    merchandiseStock,
    keluarGroups,
  ] = await Promise.all([
    prisma.stok.aggregate({ _sum: { jumlah_stok: true } }),
    prisma.merchandise.count(),
    prisma.stok.count({ where: lowStockWhere }),
    prisma.stok.findMany({
      where: lowStockWhere,
      include: { merchandise: { select: merchandiseStockSelect } },
      orderBy: { jumlah_stok: "asc" },
      take: 10,
    }),
    prisma.stok.findMany({
      include: { merchandise: { select: merchandiseStockSelect } },
      orderBy: [{ jumlah_stok: "desc" }, { id_merch: "asc" }],
    }),
    prisma.barangKeluar.groupBy({
      by: ["id_merch"],
      _sum: { jumlah: true, jumlah_kembali: true },
    }),
  ]);

  const keluarMap = new Map(
    keluarGroups.map((item) => [
      item.id_merch,
      {
        keluar: item._sum.jumlah ?? 0,
        kembali: item._sum.jumlah_kembali ?? 0,
      },
    ])
  );

  return {
    summary: {
      totalStokAktif: totalStokAktifAgg._sum.jumlah_stok ?? 0,
      jenisMerchandise: totalMerchandise,
      peringatanStokRendah,
    },
    merchandiseStock: merchandiseStock.map((item) => {
      const movement = keluarMap.get(item.id_merch);
      const dipakai = Math.max(
        0,
        (movement?.keluar ?? 0) - (movement?.kembali ?? 0)
      );
      const sisa = item.jumlah_stok;
      return {
        id_merch: item.id_merch,
        nama: item.merchandise.nama_merch,
        foto_path: item.merchandise.foto_path,
        jumlah: sisa,
        stokDipakai: dipakai,
        stokSisa: sisa,
        status: getStockStatus(sisa),
      };
    }),
    lowStockItems: stokRendah.map((item) => ({
      id_merch: item.id_merch,
      nama: item.merchandise.nama_merch,
      foto_path: item.merchandise.foto_path,
      jumlah: item.jumlah_stok,
      status: getStockStatus(item.jumlah_stok),
    })),
  };
}

const getCachedMonitoringOverview = unstable_cache(
  fetchMonitoringOverview,
  ["monitoring-overview-v3"],
  { tags: [ANALYTICS_CACHE_TAG], revalidate: 30 }
);

export async function getMonitoringOverview(_user: MonitoringUser) {
  return getCachedMonitoringOverview();
}

export type MonitoringOverview = Awaited<
  ReturnType<typeof getMonitoringOverview>
>;
