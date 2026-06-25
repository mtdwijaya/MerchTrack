import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type RiwayatSortField =
  | "id_keluar"
  | "tanggal_keluar"
  | "nama_merch"
  | "nama_kategori"
  | "nama_stasiun"
  | "jumlah";

export type SortOrder = "asc" | "desc";

const SORT_FIELDS: RiwayatSortField[] = [
  "id_keluar",
  "tanggal_keluar",
  "nama_merch",
  "nama_kategori",
  "nama_stasiun",
  "jumlah",
];

export function parseRiwayatSort(
  sortBy?: string | null,
  sortOrder?: string | null
): { sortBy: RiwayatSortField; sortOrder: SortOrder } {
  const field = SORT_FIELDS.includes(sortBy as RiwayatSortField)
    ? (sortBy as RiwayatSortField)
    : "tanggal_keluar";

  const order: SortOrder = sortOrder === "asc" ? "asc" : "desc";

  return { sortBy: field, sortOrder: order };
}

function buildOrderBy(
  sortBy: RiwayatSortField,
  sortOrder: SortOrder
): Prisma.BarangKeluarOrderByWithRelationInput {
  switch (sortBy) {
    case "nama_merch":
      return { merchandise: { nama_merch: sortOrder } };
    case "nama_kategori":
      return { kategori: { nama_kategori: sortOrder } };
    case "nama_stasiun":
      return { stasiun: { nama_stasiun: sortOrder } };
    default:
      return { [sortBy]: sortOrder };
  }
}

function buildSearchWhere(search?: string): Prisma.BarangKeluarWhereInput {
  if (!search?.trim()) return {};

  const term = search.trim();
  const numericId = Number(term.replace(/^#?TRX-/i, ""));

  const orFilters: Prisma.BarangKeluarWhereInput[] = [
    {
      merchandise: {
        is: {
          nama_merch: {
            contains: term,
            mode: "insensitive",
          },
        },
      },
    },
    {
      kategori: {
        is: {
          nama_kategori: {
            contains: term,
            mode: "insensitive",
          },
        },
      },
    },
    {
      stasiun: {
        is: {
          nama_stasiun: {
            contains: term,
            mode: "insensitive",
          },
        },
      },
    },
  ];

  if (!Number.isNaN(numericId)) {
    orFilters.push({ id_keluar: numericId });
  }

  return { OR: orFilters };
}

// riwayat transaksi = daftar barang keluar dengan filter kategori & tanggal
export async function getRiwayatTransaksiPaginated({
  page,
  limit,
  search,
  sortBy = "tanggal_keluar",
  sortOrder = "desc",
  idKategori,
  tanggal,
}: {
  page: number;
  limit: number;
  search?: string;
  sortBy?: RiwayatSortField;
  sortOrder?: SortOrder;
  idKategori?: number;
  tanggal?: string;
}) {
  const skip = (page - 1) * limit;

  const where: Prisma.BarangKeluarWhereInput = {
    ...buildSearchWhere(search),
  };

  if (idKategori) {
    where.id_kategori = idKategori;
  }

  if (tanggal) {
    where.tanggal_keluar = {
      gte: new Date(`${tanggal}T00:00:00`),
      lte: new Date(`${tanggal}T23:59:59`),
    };
  }

  const [data, total] = await Promise.all([
    prisma.barangKeluar.findMany({
      where,
      include: {
        merchandise: true,
        kategori: true,
        stasiun: true,
        user: true,
      },
      orderBy: buildOrderBy(sortBy, sortOrder),
      skip,
      take: limit,
    }),
    prisma.barangKeluar.count({ where }),
  ]);

  return {
    data,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getRiwayatTransaksiSummary() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalTransaksiBulanIni,
    totalBarangKeluar30Hari,
    stasiunTerpopulerGroup,
  ] = await Promise.all([
    prisma.barangKeluar.count({
      where: {
        tanggal_keluar: { gte: startOfMonth },
      },
    }),
    prisma.barangKeluar.aggregate({
      where: {
        tanggal_keluar: { gte: thirtyDaysAgo },
      },
      _sum: { jumlah: true },
    }),
    prisma.barangKeluar.groupBy({
      by: ["id_stasiun"],
      where: {
        tanggal_keluar: { gte: thirtyDaysAgo },
      },
      _count: { id_keluar: true },
      orderBy: {
        _count: { id_keluar: "desc" },
      },
      take: 1,
    }),
  ]);

  let stasiunTerpopuler: {
    nama_stasiun: string;
    totalDistribusi: number;
  } | null = null;

  if (stasiunTerpopulerGroup.length > 0) {
    const stasiun = await prisma.stasiun.findUnique({
      where: {
        id_stasiun: stasiunTerpopulerGroup[0].id_stasiun,
      },
    });

    if (stasiun) {
      stasiunTerpopuler = {
        nama_stasiun: stasiun.nama_stasiun,
        totalDistribusi: stasiunTerpopulerGroup[0]._count.id_keluar,
      };
    }
  }

  return {
    totalTransaksiBulanIni,
    totalBarangKeluar30Hari:
      totalBarangKeluar30Hari._sum.jumlah ?? 0,
    stasiunTerpopuler,
  };
}
