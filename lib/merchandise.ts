import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { SortOrder } from "@/lib/sort";

export type MerchandiseSortField =
  | "id_merch"
  | "nama_merch"
  | "jumlah_stok";

const SORT_FIELDS: MerchandiseSortField[] = [
  "id_merch",
  "nama_merch",
  "jumlah_stok",
];

export function parseMerchandiseSort(
  sortBy?: string | null,
  sortOrder?: string | null
): { sortBy: MerchandiseSortField; sortOrder: SortOrder } {
  const field = SORT_FIELDS.includes(sortBy as MerchandiseSortField)
    ? (sortBy as MerchandiseSortField)
    : "nama_merch";

  return {
    sortBy: field,
    sortOrder: sortOrder === "desc" ? "desc" : "asc",
  };
}

export function formatMerchandiseId(id: number) {
  return `MRC-${String(id).padStart(3, "0")}`;
}

function buildOrderBy(
  sortBy: MerchandiseSortField,
  sortOrder: SortOrder
): Prisma.MerchandiseOrderByWithRelationInput {
  if (sortBy === "jumlah_stok") {
    return { stok: { jumlah_stok: sortOrder } };
  }

  return { [sortBy]: sortOrder };
}

export async function getMerchandisePaginated({
  page,
  limit,
  search,
  sortBy = "nama_merch",
  sortOrder = "asc",
}: {
  page: number;
  limit: number;
  search?: string;
  sortBy?: MerchandiseSortField;
  sortOrder?: SortOrder;
}) {
  const skip = (page - 1) * limit;

  const where: Prisma.MerchandiseWhereInput =
    search?.trim()
      ? {
          OR: [
            {
              nama_merch: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              deskripsi: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {};

  const [data, total] = await Promise.all([
    prisma.merchandise.findMany({
      where,
      include: { stok: true },
      orderBy: buildOrderBy(sortBy, sortOrder),
      skip,
      take: limit,
    }),
    prisma.merchandise.count({ where }),
  ]);

  return {
    data,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getAllMerchandiseWithStok() {
  return prisma.merchandise.findMany({
    include: { stok: true },
    orderBy: { nama_merch: "asc" },
  });
}

export async function getMerchandiseById(id: number) {
  return prisma.merchandise.findUnique({
    where: { id_merch: id },
    include: { stok: true },
  });
}

export async function getMerchandiseSummary() {
  const [totalMerchandise, stokAggregate, lowStockCount] = await Promise.all([
    prisma.merchandise.count(),
    prisma.stok.aggregate({ _sum: { jumlah_stok: true } }),
    prisma.stok.count({ where: { jumlah_stok: { lte: 50 } } }),
  ]);

  return {
    totalMerchandise,
    totalStok: stokAggregate._sum.jumlah_stok ?? 0,
    lowStockCount,
  };
}

export async function createMerchandise(data: {
  nama_merch: string;
  deskripsi?: string;
  jumlah_stok?: number;
}) {
  return prisma.merchandise.create({
    data: {
      nama_merch: data.nama_merch,
      deskripsi: data.deskripsi,
      stok: {
        create: {
          jumlah_stok: data.jumlah_stok ?? 0,
        },
      },
    },
    include: { stok: true },
  });
}

export async function updateMerchandise(
  id: number,
  data: {
    nama_merch: string;
    deskripsi?: string;
    jumlah_stok?: number;
  }
) {
  const existing = await prisma.merchandise.findUnique({
    where: { id_merch: id },
    include: { stok: true },
  });

  if (!existing) {
    throw new Error("Merchandise tidak ditemukan");
  }

  if (existing.stok) {
    await prisma.stok.update({
      where: { id_merch: id },
      data: { jumlah_stok: data.jumlah_stok ?? existing.stok.jumlah_stok },
    });
  } else {
    await prisma.stok.create({
      data: {
        id_merch: id,
        jumlah_stok: data.jumlah_stok ?? 0,
      },
    });
  }

  return prisma.merchandise.update({
    where: { id_merch: id },
    data: {
      nama_merch: data.nama_merch,
      deskripsi: data.deskripsi,
    },
    include: { stok: true },
  });
}

export async function deleteMerchandise(id: number) {
  const merchandise = await prisma.merchandise.findUnique({
    where: { id_merch: id },
    include: {
      _count: {
        select: {
          barangKeluar: true,
          barangMasuk: true,
        },
      },
    },
  });

  if (!merchandise) {
    throw new Error("Merchandise tidak ditemukan");
  }

  if (
    merchandise._count.barangKeluar > 0 ||
    merchandise._count.barangMasuk > 0
  ) {
    throw new Error(
      "Merchandise tidak dapat dihapus karena masih memiliki transaksi"
    );
  }

  return prisma.merchandise.delete({
    where: { id_merch: id },
  });
}
