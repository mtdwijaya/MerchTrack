import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { SortOrder } from "@/lib/sort";

export type BarangKeluarSortField =
  | "id_keluar"
  | "tanggal_keluar"
  | "nama_merch"
  | "nama_stasiun"
  | "nama_kategori"
  | "jumlah";

const SORT_FIELDS: BarangKeluarSortField[] = [
  "id_keluar",
  "tanggal_keluar",
  "nama_merch",
  "nama_stasiun",
  "nama_kategori",
  "jumlah",
];

export function parseBarangKeluarSort(
  sortBy?: string | null,
  sortOrder?: string | null
): { sortBy: BarangKeluarSortField; sortOrder: SortOrder } {
  const field = SORT_FIELDS.includes(sortBy as BarangKeluarSortField)
    ? (sortBy as BarangKeluarSortField)
    : "tanggal_keluar";

  return {
    sortBy: field,
    sortOrder: sortOrder === "asc" ? "asc" : "desc",
  };
}

function buildOrderBy(
  sortBy: BarangKeluarSortField,
  sortOrder: SortOrder
): Prisma.BarangKeluarOrderByWithRelationInput {
  switch (sortBy) {
    case "nama_merch":
      return { merchandise: { nama_merch: sortOrder } };
    case "nama_stasiun":
      return { stasiun: { nama_stasiun: sortOrder } };
    case "nama_kategori":
      return { kategori: { nama_kategori: sortOrder } };
    default:
      return { [sortBy]: sortOrder };
  }
}

function buildSearchWhere(search?: string): Prisma.BarangKeluarWhereInput {
  if (!search?.trim()) return {};

  const term = search.trim();
  const numericId = Number(term.replace(/^#?/i, ""));

  const orFilters: Prisma.BarangKeluarWhereInput[] = [
    {
      merchandise: {
        is: {
          nama_merch: { contains: term, mode: "insensitive" },
        },
      },
    },
    {
      stasiun: {
        is: {
          nama_stasiun: { contains: term, mode: "insensitive" },
        },
      },
    },
    {
      kategori: {
        is: {
          nama_kategori: { contains: term, mode: "insensitive" },
        },
      },
    },
  ];

  if (!Number.isNaN(numericId)) {
    orFilters.push({ id_keluar: numericId });
  }

  return { OR: orFilters };
}

export async function getBarangKeluarPaginated({
  page,
  limit,
  search,
  sortBy = "tanggal_keluar",
  sortOrder = "desc",
  idStasiun,
  idKategori,
}: {
  page: number;
  limit: number;
  search?: string;
  sortBy?: BarangKeluarSortField;
  sortOrder?: SortOrder;
  idStasiun?: number;
  idKategori?: number;
}) {
  const skip = (page - 1) * limit;

  const where: Prisma.BarangKeluarWhereInput = {
    ...buildSearchWhere(search),
  };

  if (idStasiun) where.id_stasiun = idStasiun;
  if (idKategori) where.id_kategori = idKategori;

  const [data, total] = await Promise.all([
    prisma.barangKeluar.findMany({
      where,
      include: {
        merchandise: true,
        stasiun: true,
        kategori: true,
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

export async function getBarangKeluar() {
  return prisma.barangKeluar.findMany({
    include: {
      merchandise: true,
      stasiun: true,
      kategori: true,
      user: true,
    },

    orderBy: {
      tanggal_keluar: "desc",
    },
  });
}

export async function getBarangKeluarById(
  id: number
) {
  return prisma.barangKeluar.findUnique({
    where: {
      id_keluar: id,
    },

    include: {
      merchandise: true,
      stasiun: true,
      kategori: true,
      user: true,
    },
  });
}

export async function createBarangKeluar(
  data: {
    id_merch: number;
    id_stasiun: number;
    id_kategori: number;
    id_user: number;
    jumlah: number;
    tanggal_keluar?: Date;
    keterangan?: string;
  }
) {
  const stok =
    await prisma.stok.findUnique({
      where: {
        id_merch: data.id_merch,
      },
    });

  if (!stok) {
    throw new Error(
      "Data stok tidak ditemukan"
    );
  }

  if (
    stok.jumlah_stok < data.jumlah
  ) {
    throw new Error(
      "Stok tidak mencukupi"
    );
  }

  const transaksi =
    await prisma.barangKeluar.create({
      data: {
        id_merch: data.id_merch,
        id_stasiun:
          data.id_stasiun,
        id_kategori:
          data.id_kategori,
        id_user: data.id_user,
        jumlah: data.jumlah,
        tanggal_keluar:
          data.tanggal_keluar ??
          new Date(),
        keterangan:
          data.keterangan,
      },
    });

  await prisma.stok.update({
    where: {
      id_merch: data.id_merch,
    },

    data: {
      jumlah_stok: {
        decrement:
          data.jumlah,
      },
    },
  });

  return transaksi;
}

export async function updateBarangKeluar(
  id: number,
  data: {
    id_merch: number;
    id_stasiun: number;
    id_kategori: number;
    jumlah: number;
    tanggal_keluar?: Date;
    keterangan?: string;
  }
) {
  const transaksiLama =
    await prisma.barangKeluar.findUnique({
      where: {
        id_keluar: id,
      },
    });

  if (!transaksiLama) {
    throw new Error(
      "Transaksi tidak ditemukan"
    );
  }

  await prisma.stok.update({
    where: {
      id_merch:
        transaksiLama.id_merch,
    },

    data: {
      jumlah_stok: {
        increment:
          transaksiLama.jumlah,
      },
    },
  });

  const stokBaru =
    await prisma.stok.findUnique({
      where: {
        id_merch: data.id_merch,
      },
    });

  if (
    !stokBaru ||
    stokBaru.jumlah_stok <
      data.jumlah
  ) {
    throw new Error(
      "Stok tidak mencukupi"
    );
  }

  await prisma.stok.update({
    where: {
      id_merch: data.id_merch,
    },

    data: {
      jumlah_stok: {
        decrement:
          data.jumlah,
      },
    },
  });

  return prisma.barangKeluar.update({
    where: {
      id_keluar: id,
    },

    data: {
      id_merch: data.id_merch,
      id_stasiun:
        data.id_stasiun,
      id_kategori:
        data.id_kategori,
      jumlah: data.jumlah,
      tanggal_keluar:
        data.tanggal_keluar,
      keterangan:
        data.keterangan,
    },
  });
}

export async function deleteBarangKeluar(
  id: number
) {
  const transaksi =
    await prisma.barangKeluar.findUnique({
      where: {
        id_keluar: id,
      },
    });

  if (!transaksi) {
    throw new Error(
      "Transaksi tidak ditemukan"
    );
  }

  await prisma.stok.update({
    where: {
      id_merch:
        transaksi.id_merch,
    },

    data: {
      jumlah_stok: {
        increment:
          transaksi.jumlah,
      },
    },
  });

  return prisma.barangKeluar.delete({
    where: {
      id_keluar: id,
    },
  });
}