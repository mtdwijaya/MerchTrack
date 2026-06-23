 import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type StasiunSortField =
  | "kode_stasiun"
  | "nama_stasiun";

export type SortOrder = "asc" | "desc";

const SORT_FIELDS: StasiunSortField[] = [
  "kode_stasiun",
  "nama_stasiun",
];

export function parseStasiunSort(
  sortBy?: string | null,
  sortOrder?: string | null
): { sortBy: StasiunSortField; sortOrder: SortOrder } {
  const field = SORT_FIELDS.includes(sortBy as StasiunSortField)
    ? (sortBy as StasiunSortField)
    : "nama_stasiun";

  const order: SortOrder = sortOrder === "desc" ? "desc" : "asc";

  return { sortBy: field, sortOrder: order };
}

export async function getStasiunPaginated({
  page,
  limit,
  search,
  sortBy = "nama_stasiun",
  sortOrder = "asc",
}: {
  page: number;
  limit: number;
  search?: string;
  sortBy?: StasiunSortField;
  sortOrder?: SortOrder;
}) {
  const skip = (page - 1) * limit;

  const where: Prisma.StasiunWhereInput =
    search && search.trim() !== ""
      ? {
          OR: [
            {
              kode_stasiun: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              nama_stasiun: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              alamat: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {};

  const [data, total] = await Promise.all([
    prisma.stasiun.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.stasiun.count({ where }),
  ]);

  return {
    data,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getAllStasiun() {
  return prisma.stasiun.findMany({
    orderBy: { nama_stasiun: "asc" },
  });
}

export async function getStasiunById(id: number) {
  return prisma.stasiun.findUnique({
    where: { id_stasiun: id },
  });
}

export async function createStasiun(data: {
  kode_stasiun: string;
  nama_stasiun: string;
  alamat?: string;
  kontak?: string;
}) {
  const existing = await prisma.stasiun.findUnique({
    where: { kode_stasiun: data.kode_stasiun },
  });

  if (existing) {
    throw new Error("Kode stasiun sudah digunakan");
  }

  return prisma.stasiun.create({ data });
}

export async function updateStasiun(
  id: number,
  data: {
    kode_stasiun: string;
    nama_stasiun: string;
    alamat?: string;
    kontak?: string;
  }
) {
  const existing = await prisma.stasiun.findFirst({
    where: {
      kode_stasiun: data.kode_stasiun,
      NOT: { id_stasiun: id },
    },
  });

  if (existing) {
    throw new Error("Kode stasiun sudah digunakan");
  }

  return prisma.stasiun.update({
    where: { id_stasiun: id },
    data,
  });
}

export async function deleteStasiun(id: number) {
  const stasiun = await prisma.stasiun.findUnique({
    where: { id_stasiun: id },
    include: {
      _count: {
        select: {
          barangKeluar: true,
          users: true,
        },
      },
    },
  });

  if (!stasiun) {
    throw new Error("Stasiun tidak ditemukan");
  }

  if (stasiun._count.barangKeluar > 0) {
    throw new Error(
      "Stasiun tidak dapat dihapus karena masih memiliki transaksi barang keluar"
    );
  }

  if (stasiun._count.users > 0) {
    throw new Error(
      "Stasiun tidak dapat dihapus karena masih memiliki pengguna terdaftar"
    );
  }

  return prisma.stasiun.delete({
    where: { id_stasiun: id },
  });
}

export async function getStasiunSummary() {
  const [totalStasiun, stasiunWithTransaksi, totalPetugas] =
    await Promise.all([
      prisma.stasiun.count(),
      prisma.barangKeluar.groupBy({ by: ["id_stasiun"] }),
      prisma.user.count({ where: { id_stasiun: { not: null } } }),
    ]);

  return {
    totalStasiun,
    stasiunAktif: stasiunWithTransaksi.length,
    totalPetugas,
  };
}
