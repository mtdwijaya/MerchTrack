import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { SortOrder } from "@/lib/sort";

export type MonitoringSortField =
  | "nama_merch"
  | "jumlah_stok";

const SORT_FIELDS: MonitoringSortField[] = [
  "nama_merch",
  "jumlah_stok",
];

export type StockStatus = "normal" | "rendah" | "habis";

/** stok < 20 pcs (0–19) = rendah/habis — dipakai semua halaman KPI */
export const LOW_STOCK_MAX = 20;

/** filter prisma: termasuk stok habis */
export const lowStockWhere = {
  jumlah_stok: { lte: LOW_STOCK_MAX },
} satisfies Prisma.StokWhereInput;

export function getStockStatus(jumlah: number): StockStatus {
  if (jumlah <= 0) return "habis";
  if (jumlah <= LOW_STOCK_MAX) return "rendah";
  return "normal";
}

export function parseMonitoringSort(
  sortBy?: string | null,
  sortOrder?: string | null
): { sortBy: MonitoringSortField; sortOrder: SortOrder } {
  const field = SORT_FIELDS.includes(sortBy as MonitoringSortField)
    ? (sortBy as MonitoringSortField)
    : "jumlah_stok";

  return {
    sortBy: field,
    sortOrder: sortOrder === "asc" ? "asc" : "desc",
  };
}

export async function getMonitoringPaginated({
  page,
  limit,
  search,
  sortBy = "jumlah_stok",
  sortOrder = "asc",
  status,
}: {
  page: number;
  limit: number;
  search?: string;
  sortBy?: MonitoringSortField;
  sortOrder?: SortOrder;
  status?: StockStatus;
}) {
  const skip = (page - 1) * limit;

  const where: Prisma.StokWhereInput = {};

  if (search?.trim()) {
    where.merchandise = {
      is: {
        nama_merch: {
          contains: search,
          mode: "insensitive",
        },
      },
    };
  }

  if (status === "habis") {
    where.jumlah_stok = { lte: 0 };
  } else if (status === "rendah") {
    where.jumlah_stok = { gt: 0, lte: LOW_STOCK_MAX };
  } else if (status === "normal") {
    where.jumlah_stok = { gt: LOW_STOCK_MAX };
  }

  const orderBy =
    sortBy === "nama_merch"
      ? { merchandise: { nama_merch: sortOrder } }
      : { jumlah_stok: sortOrder };

  const [data, total] = await Promise.all([
    prisma.stok.findMany({
      where,
      include: { merchandise: true },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.stok.count({ where }),
  ]);

  return {
    data: data.map((item) => ({
      id_stok: item.id_stok,
      id_merch: item.id_merch,
      nama_merch: item.merchandise.nama_merch,
      foto_path: item.merchandise.foto_path ?? null,
      jumlah_stok: item.jumlah_stok,
      status: getStockStatus(item.jumlah_stok),
    })),
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getMonitoringSummary() {
  const [totalItem, stokAggregate, rendah, habis] = await Promise.all([
    prisma.stok.count(),
    prisma.stok.aggregate({ _sum: { jumlah_stok: true } }),
    prisma.stok.count({
      where: { jumlah_stok: { gt: 0, lte: LOW_STOCK_MAX } },
    }),
    prisma.stok.count({ where: { jumlah_stok: { lte: 0 } } }),
  ]);

  return {
    totalItem,
    totalStok: stokAggregate._sum.jumlah_stok ?? 0,
    stokRendah: rendah,
    stokHabis: habis,
  };
}
