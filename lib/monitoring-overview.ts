import { prisma } from "@/lib/prisma";
import { formatMerchandiseId } from "@/lib/merchandise";
import { formatStasiunId } from "@/lib/format-stasiun";
import { getStockStatus } from "@/lib/monitoring";

function monthRange(offset = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59, 59);
  return { start, end };
}

export async function getMonitoringOverview() {
  const thisMonth = monthRange(0);
  const lastMonth = monthRange(-1);

  const [
    totalStokAktifAgg,
    stasiunAktifGroup,
    distribusiBulanIniAgg,
    peringatanStokRendah,
    barangKeluarBulanIni,
    barangKeluarBulanLalu,
    distribusiPerStasiun,
    recentBarangKeluar,
    stokRendah,
  ] = await Promise.all([
    prisma.stok.aggregate({ _sum: { jumlah_stok: true } }),
    prisma.barangKeluar.groupBy({ by: ["id_stasiun"] }),
    prisma.barangKeluar.aggregate({
      where: { tanggal_keluar: { gte: thisMonth.start, lte: thisMonth.end } },
      _sum: { jumlah: true },
    }),
    prisma.stok.count({ where: { jumlah_stok: { gt: 0, lte: 50 } } }),
    prisma.barangKeluar.findMany({
      where: { tanggal_keluar: { gte: thisMonth.start, lte: thisMonth.end } },
      include: { merchandise: true },
    }),
    prisma.barangKeluar.findMany({
      where: { tanggal_keluar: { gte: lastMonth.start, lte: lastMonth.end } },
      include: { merchandise: true },
    }),
    prisma.barangKeluar.groupBy({
      by: ["id_stasiun"],
      where: { tanggal_keluar: { gte: thisMonth.start, lte: thisMonth.end } },
      _sum: { jumlah: true },
      orderBy: { _sum: { jumlah: "desc" } },
      take: 4,
    }),
    prisma.barangKeluar.findMany({
      take: 5,
      orderBy: { tanggal_keluar: "desc" },
      include: {
        merchandise: true,
        stasiun: true,
        user: true,
      },
    }),
    prisma.stok.findMany({
      where: { jumlah_stok: { gt: 0, lte: 50 } },
      include: { merchandise: true },
      orderBy: { jumlah_stok: "asc" },
    }),
  ]);

  const merchMapThis = new Map<number, { nama: string; total: number }>();
  barangKeluarBulanIni.forEach((item) => {
    const current = merchMapThis.get(item.id_merch) ?? {
      nama: item.merchandise.nama_merch,
      total: 0,
    };
    current.total += item.jumlah;
    merchMapThis.set(item.id_merch, current);
  });

  const merchMapLast = new Map<number, number>();
  barangKeluarBulanLalu.forEach((item) => {
    merchMapLast.set(
      item.id_merch,
      (merchMapLast.get(item.id_merch) ?? 0) + item.jumlah
    );
  });

  const topMerchandise = Array.from(merchMapThis.entries())
    .map(([id, data]) => ({
      id_merch: id,
      nama: data.nama,
      total: data.total,
      delta: data.total - (merchMapLast.get(id) ?? 0),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

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

  const activityFromTransactions = recentBarangKeluar.map((item) => {
    const minutesAgo = Math.max(
      1,
      Math.round((Date.now() - new Date(item.tanggal_keluar).getTime()) / 60000)
    );

    let timeLabel = `${minutesAgo} mins ago`;
    if (minutesAgo >= 60) {
      const hours = Math.round(minutesAgo / 60);
      timeLabel = `${hours} hour${hours > 1 ? "s" : ""} ago`;
    }

    return {
      id: `bk-${item.id_keluar}`,
      message: `${item.stasiun.kode_stasiun} requested ${item.jumlah} units of ${formatMerchandiseId(item.id_merch)}.`,
      time: timeLabel,
      type: item.jumlah >= 50 ? "Urgent" : "Processing",
      tone: item.jumlah >= 50 ? "urgent" : "processing",
    };
  });

  const activityFromStock = stokRendah.map((item) => ({
    id: `stok-${item.id_stok}`,
    message: `${formatMerchandiseId(item.id_merch)} reached critical threshold (${Math.max(1, Math.round((item.jumlah_stok / 50) * 100))}%).`,
    time: "System Alert",
    type: "System Alert",
    tone: "alert" as const,
  }));

  const recentActivity = [...activityFromStock, ...activityFromTransactions].slice(
    0,
    5
  );

  return {
    summary: {
      totalStokAktif: totalStokAktifAgg._sum.jumlah_stok ?? 0,
      stasiunAktif: stasiunAktifGroup.length,
      distribusiBulanIni: distribusiBulanIniAgg._sum.jumlah ?? 0,
      peringatanStokRendah,
    },
    topMerchandise,
    stasiunDistribution,
    recentActivity,
    lowStockItems: stokRendah.map((item) => ({
      id_merch: item.id_merch,
      nama: item.merchandise.nama_merch,
      jumlah: item.jumlah_stok,
      status: getStockStatus(item.jumlah_stok),
    })),
  };
}
