import { prisma } from "@/lib/prisma";

export async function getDashboardData() {
  const [
    merchandiseCount,
    stationCount,
    stockRows,
    barangKeluarRows,
  ] = await Promise.all([
    prisma.merchandise.count(),

    prisma.stasiun.count(),

    prisma.stok.findMany(),

    prisma.barangKeluar.findMany({
      include: {
        merchandise: true,
        stasiun: true,
      },
    }),
  ]);

  const totalStock = stockRows.reduce(
    (acc, item) => acc + item.jumlah_stok,
    0
  );

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const barangKeluarBulanIni = barangKeluarRows
    .filter((item) => {
      const d = new Date(item.tanggal_keluar);

      return (
        d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear
      );
    })
    .reduce((acc, item) => acc + item.jumlah, 0);

  const merchandiseMap = new Map<
    string,
    number
  >();

  barangKeluarRows.forEach((item) => {
    const current =
      merchandiseMap.get(
        item.merchandise.nama_merch
      ) ?? 0;

    merchandiseMap.set(
      item.merchandise.nama_merch,
      current + item.jumlah
    );
  });

  const topMerchandise = Array.from(
    merchandiseMap.entries()
  )
    .map(([nama, total]) => ({
      nama,
      total,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const stationMap = new Map<
    string,
    number
  >();

  barangKeluarRows.forEach((item) => {
    const current =
      stationMap.get(
        item.stasiun.nama_stasiun
      ) ?? 0;

    stationMap.set(
      item.stasiun.nama_stasiun,
      current + item.jumlah
    );
  });

  const distribusiPerStasiun = Array.from(
    stationMap.entries()
  )
    .map(([nama, total]) => ({
      nama,
      total,
    }))
    .sort((a, b) => b.total - a.total);

  const stokGudang = await prisma.stok.findMany({
    include: {
      merchandise: true,
    },
    orderBy: {
      jumlah_stok: "desc",
    },
    take: 8,
  });

  return {
    totalMerchandise: merchandiseCount,
    totalStock,
    totalBarangKeluarBulanIni:
      barangKeluarBulanIni,
    totalStasiun: stationCount,

    topMerchandise,

    distribusiPerStasiun,

    stokGudang: stokGudang.map((item) => ({
      id: item.id_stok,
      nama:
        item.merchandise.nama_merch,
      stok: item.jumlah_stok,
    })),
  };
}