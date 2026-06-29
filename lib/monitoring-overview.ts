import type { Role } from "@prisma/client";
import { unstable_cache } from "next/cache";

import { ANALYTICS_CACHE_TAG } from "@/lib/revalidate-analytics";
import { formatStasiunId } from "@/lib/format-stasiun";
import { getStockStatus } from "@/lib/monitoring";
import {
  recentBarangKeluarInclude,
  recentBarangMasukInclude,
} from "@/lib/prisma-selects";
import { prisma } from "@/lib/prisma";

export type ActivityAudience = "all" | "admin";

export type RecentActivityItem = {
  id: string;
  message: string;
  occurredAt: string | null;
  type: string;
  tone: "urgent" | "processing" | "alert" | "verified";
  audience: ActivityAudience;
};

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

function buildRecentActivity(
  user: MonitoringUser,
  recentBarangKeluar: {
    id_keluar: number;
    jumlah: number;
    tanggal_keluar: Date;
    merchandise: { nama_merch: string };
    stasiun: { nama_stasiun: string };
    user: { nama_user: string };
  }[],
  recentBarangMasuk: {
    id_masuk: number;
    jumlah: number;
    tanggal_masuk: Date;
    merchandise: { nama_merch: string };
    user: { nama_user: string };
  }[],
  stokRendah: {
    id_stok: number;
    jumlah_stok: number;
    merchandise: { nama_merch: string };
  }[]
): RecentActivityItem[] {
  const activityFromKeluar: RecentActivityItem[] = recentBarangKeluar.map(
    (item) => ({
      id: `bk-${item.id_keluar}`,
      message: `${item.user.nama_user} mencatat barang keluar ${item.jumlah} unit ${item.merchandise.nama_merch} ke ${item.stasiun.nama_stasiun}.`,
      occurredAt: new Date(item.tanggal_keluar).toISOString(),
      type: item.jumlah >= 50 ? "Mendesak" : "Barang Keluar",
      tone: item.jumlah >= 50 ? "urgent" : "processing",
      audience: "all",
    })
  );

  const activityFromMasuk: RecentActivityItem[] =
    user.role === "ADMIN"
      ? recentBarangMasuk.map((item) => ({
          id: `bm-${item.id_masuk}`,
          message: `${item.user.nama_user} restock ${item.jumlah} unit ${item.merchandise.nama_merch}.`,
          occurredAt: new Date(item.tanggal_masuk).toISOString(),
          type: "Restock",
          tone: "verified",
          audience: "admin",
        }))
      : [];

  const activityFromStock: RecentActivityItem[] = stokRendah.slice(0, 5).map((item) => ({
    id: `stok-${item.id_stok}`,
    message: `${item.merchandise.nama_merch} mendekati batas stok rendah (${item.jumlah_stok} pcs tersisa).`,
    occurredAt: null,
    type: "Peringatan",
    tone: "alert",
    audience: "all",
  }));

  const keluarTimes = new Map(
    recentBarangKeluar.map((item) => [
      `bk-${item.id_keluar}`,
      item.id_keluar,
    ])
  );
  const masukTimes = new Map(
    recentBarangMasuk.map((item) => [
      `bm-${item.id_masuk}`,
      item.id_masuk,
    ])
  );

  return [...activityFromKeluar, ...activityFromMasuk, ...activityFromStock]
    .sort((a, b) => {
      const timeA = keluarTimes.get(a.id) ?? masukTimes.get(a.id) ?? 0;
      const timeB = keluarTimes.get(b.id) ?? masukTimes.get(b.id) ?? 0;
      return timeB - timeA;
    })
    .slice(0, 8);
}

async function fetchMonitoringOverview(role: Role) {
  const thisMonth = monthRange(0);
  const lastMonth = monthRange(-1);

  // semua query dijalankan paralel untuk mempercepat load halaman monitoring
  const [
    totalStokAktifAgg,
    stasiunAktifGroup,
    distribusiBulanIniAgg,
    peringatanStokRendah,
    merchGroupThisMonth,
    merchGroupLastMonth,
    distribusiPerStasiun,
    stokRendah,
  ] = await Promise.all([
    prisma.stok.aggregate({ _sum: { jumlah_stok: true } }),
    prisma.barangKeluar.groupBy({ by: ["id_stasiun"] }),
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
    prisma.barangKeluar.groupBy({
      by: ["id_merch"],
      where: { tanggal_keluar: { gte: lastMonth.start, lte: lastMonth.end } },
      _sum: { jumlah: true },
    }),
    prisma.barangKeluar.groupBy({
      by: ["id_stasiun"],
      where: { tanggal_keluar: { gte: thisMonth.start, lte: thisMonth.end } },
      _sum: { jumlah: true },
      orderBy: { _sum: { jumlah: "desc" } },
      take: 4,
    }),
    prisma.stok.findMany({
      where: { jumlah_stok: { gt: 0, lte: 50 } },
      include: { merchandise: true },
      orderBy: { jumlah_stok: "asc" },
      take: 10,
    }),
  ]);

  const lastMonthMap = new Map(
    merchGroupLastMonth.map((item) => [item.id_merch, item._sum.jumlah ?? 0])
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
    delta: (item._sum.jumlah ?? 0) - (lastMonthMap.get(item.id_merch) ?? 0),
  }));

  const stasiunIds = distribusiPerStasiun.map((item) => item.id_stasiun);
  const stasiunRecords = await prisma.stasiun.findMany({
    where: { id_stasiun: { in: stasiunIds } },
  });
  const stasiunMap = new Map(
    stasiunRecords.map((item) => [item.id_stasiun, item])
  );

  const stasiunDistribution = distribusiPerStasiun.map((item) => {
    const stasiun = stasiunMap.get(item.id_stasiun);
    return {
      id_stasiun: item.id_stasiun,
      kode: stasiun?.kode_stasiun ?? formatStasiunId(item.id_stasiun),
      nama: stasiun?.nama_stasiun ?? "Stasiun",
      total: item._sum.jumlah ?? 0,
    };
  });

  return {
    summary: {
      totalStokAktif: totalStokAktifAgg._sum.jumlah_stok ?? 0,
      stasiunAktif: stasiunAktifGroup.length,
      distribusiBulanIni: distribusiBulanIniAgg._sum.jumlah ?? 0,
      peringatanStokRendah,
    },
    topMerchandise,
    stasiunDistribution,
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

// aktivitas terbaru tidak di-cache supaya waktu & urutan selalu fresh
export async function getRecentActivity(user: MonitoringUser) {
  const isAdmin = user.role === "ADMIN";

  const [recentBarangKeluar, recentBarangMasuk, stokRendah] =
    await Promise.all([
      prisma.barangKeluar.findMany({
        take: 8,
        orderBy: { id_keluar: "desc" },
        include: recentBarangKeluarInclude,
      }),
      isAdmin
        ? prisma.barangMasuk.findMany({
            take: 8,
            orderBy: { id_masuk: "desc" },
            include: recentBarangMasukInclude,
          })
        : Promise.resolve([]),
      prisma.stok.findMany({
        where: { jumlah_stok: { gt: 0, lte: 50 } },
        include: { merchandise: true },
        orderBy: { jumlah_stok: "asc" },
        take: 10,
      }),
    ]);

  return buildRecentActivity(user, recentBarangKeluar, recentBarangMasuk, stokRendah);
}

export type MonitoringOverview = Awaited<ReturnType<typeof getMonitoringOverview>>;
export type RecentActivity = Awaited<ReturnType<typeof getRecentActivity>>;
