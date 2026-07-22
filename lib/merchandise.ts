import { revalidateTag, unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { lowStockWhere } from "@/lib/monitoring";
import { SortOrder } from "@/lib/sort";

export const MERCHANDISE_LIST_CACHE_TAG = "merchandise-list";

// data master merchandise untuk dropdown — di-cache, invalidasi saat crud/restock

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

// samakan aturan dengan backfill di migration: lowercase + trim + spasi tunggal
export function normalizeNamaMerch(nama: string) {
  return nama.trim().toLowerCase().replace(/\s+/g, " ");
}

// cek apakah nama sudah dipakai merchandise lain (case-insensitive)
async function isNamaMerchTaken(namaNormalized: string, excludeId?: number) {
  const existing = await prisma.merchandise.findFirst({
    where: {
      nama_normalized: namaNormalized,
      ...(excludeId ? { id_merch: { not: excludeId } } : {}),
    },
    select: { id_merch: true },
  });

  return existing !== null;
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

export type MerchandiseStockMovement = {
  stokAwal: number;
  stokKeluar: number;
  stokDikembalikan: number;
  restock: number;
  stokAkhir: number;
};

async function getMerchandiseStockMovements(merchIds: number[]) {
  if (merchIds.length === 0) {
    return new Map<number, Omit<MerchandiseStockMovement, "stokAwal" | "stokAkhir">>();
  }

  const [keluarGroups, masukGroups] = await Promise.all([
    prisma.barangKeluar.groupBy({
      by: ["id_merch"],
      where: { id_merch: { in: merchIds } },
      _sum: { jumlah: true, jumlah_kembali: true },
    }),
    prisma.barangMasuk.groupBy({
      by: ["id_merch"],
      where: { id_merch: { in: merchIds } },
      _sum: { jumlah: true },
    }),
  ]);

  const keluarMap = new Map(keluarGroups.map((item) => [item.id_merch, item]));
  const masukMap = new Map(masukGroups.map((item) => [item.id_merch, item]));

  return new Map(
    merchIds.map((id) => {
      const keluar = keluarMap.get(id);
      const masuk = masukMap.get(id);
      const jumlahKeluar = keluar?._sum.jumlah ?? 0;
      const jumlahKembali = keluar?._sum.jumlah_kembali ?? 0;

      return [
        id,
        {
          stokKeluar: jumlahKeluar + jumlahKembali,
          stokDikembalikan: jumlahKembali,
          restock: masuk?._sum.jumlah ?? 0,
        },
      ];
    })
  );
}

function buildStockMovement(
  stokAkhir: number,
  movement: Omit<MerchandiseStockMovement, "stokAwal" | "stokAkhir">
): MerchandiseStockMovement {
  return {
    stokAwal:
      stokAkhir -
      movement.restock -
      movement.stokDikembalikan +
      movement.stokKeluar,
    stokKeluar: movement.stokKeluar,
    stokDikembalikan: movement.stokDikembalikan,
    restock: movement.restock,
    stokAkhir,
  };
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

  const merchIds = data.map((item) => item.id_merch);
  const movements = await getMerchandiseStockMovements(merchIds);

  const enrichedData = data.map((item) => {
    const stokAkhir = item.stok?.jumlah_stok ?? 0;
    const movement = movements.get(item.id_merch) ?? {
      stokKeluar: 0,
      stokDikembalikan: 0,
      restock: 0,
    };

    return {
      id_merch: item.id_merch,
      nama_merch: item.nama_merch,
      deskripsi: item.deskripsi,
      stok: item.stok,
      movement: buildStockMovement(stokAkhir, movement),
    };
  });

  return {
    data: enrichedData,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

async function fetchAllMerchandiseNames() {
  const items = await prisma.merchandise.findMany({
    select: {
      id_merch: true,
      nama_merch: true,
      stok: { select: { jumlah_stok: true } },
    },
    orderBy: { nama_merch: "asc" },
  });

  return items.map((item) => ({
    id_merch: item.id_merch,
    nama_merch: item.nama_merch,
    jumlah_stok: item.stok?.jumlah_stok ?? 0,
  }));
}

export const getAllMerchandiseNames = unstable_cache(
  fetchAllMerchandiseNames,
  ["all-merchandise-names"],
  { tags: [MERCHANDISE_LIST_CACHE_TAG] }
);

export function revalidateMerchandiseListCache() {
  revalidateTag(MERCHANDISE_LIST_CACHE_TAG, "max");
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
    prisma.stok.count({ where: lowStockWhere }),
  ]);

  return {
    totalMerchandise,
    totalStok: stokAggregate._sum.jumlah_stok ?? 0,
    lowStockCount,
  };
}

export async function createMerchandise(
  data: {
    nama_merch: string;
    deskripsi?: string;
    jumlah_stok?: number;
  },
  id_user?: number
) {
  const nama_merch = data.nama_merch.trim();
  const nama_normalized = normalizeNamaMerch(nama_merch);
  const jumlah_stok = data.jumlah_stok ?? 0;

  if (await isNamaMerchTaken(nama_normalized)) {
    throw new Error("Merchandise dengan nama ini sudah ada");
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const created = await tx.merchandise.create({
        data: {
          nama_merch,
          nama_normalized,
          deskripsi: data.deskripsi,
          stok: {
            create: {
              jumlah_stok,
            },
          },
        },
        include: { stok: true },
      });

      // stok awal = barang masuk jenis BARU (bila user + jumlah > 0)
      if (id_user && jumlah_stok > 0) {
        await tx.barangMasuk.create({
          data: {
            id_merch: created.id_merch,
            id_user,
            jumlah: jumlah_stok,
            jenis: "BARU",
            keterangan: "Penambahan jenis merchandise baru",
          },
        });
      }

      return created;
    });
  } catch (error) {
    // jaga-jaga bila lolos pengecekan karena request bersamaan (race condition)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("Merchandise dengan nama ini sudah ada");
    }
    throw error;
  }
}

export async function updateMerchandise(
  id: number,
  data: {
    nama_merch: string;
    deskripsi?: string;
  }
) {
  // edit merchandise hanya ubah nama/deskripsi, stok diubah lewat restock
  const existing = await prisma.merchandise.findUnique({
    where: { id_merch: id },
  });

  if (!existing) {
    throw new Error("Merchandise tidak ditemukan");
  }

  const nama_merch = data.nama_merch.trim();
  const nama_normalized = normalizeNamaMerch(nama_merch);

  if (await isNamaMerchTaken(nama_normalized, id)) {
    throw new Error("Merchandise dengan nama ini sudah ada");
  }

  try {
    return await prisma.merchandise.update({
      where: { id_merch: id },
      data: {
        nama_merch,
        nama_normalized,
        deskripsi: data.deskripsi,
      },
      include: { stok: true },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("Merchandise dengan nama ini sudah ada");
    }
    throw error;
  }
}

export async function restockMerchandise(
  id_merch: number,
  id_user: number,
  data: {
    jumlah: number;
    keterangan?: string;
    bukti_path?: string | null;
    bukti_nama?: string | null;
  }
) {
  if (!Number.isFinite(data.jumlah) || data.jumlah <= 0) {
    throw new Error("Jumlah restock harus lebih dari 0");
  }

  return prisma.$transaction(async (tx) => {
    const merchandise = await tx.merchandise.findUnique({
      where: { id_merch },
      include: { stok: true },
    });

    if (!merchandise) {
      throw new Error("Merchandise tidak ditemukan");
    }

    // catat riwayat masuk + tambah stok gudang dalam satu transaksi db
    await tx.barangMasuk.create({
      data: {
        id_merch,
        id_user,
        jumlah: data.jumlah,
        jenis: "RESTOCK",
        keterangan: data.keterangan?.trim() || "Restock gudang pusat",
        bukti_path: data.bukti_path,
        bukti_nama: data.bukti_nama,
      },
    });

    const stokSaatIni = merchandise.stok?.jumlah_stok ?? 0;

    if (merchandise.stok) {
      await tx.stok.update({
        where: { id_merch },
        data: { jumlah_stok: stokSaatIni + data.jumlah },
      });
    } else {
      await tx.stok.create({
        data: {
          id_merch,
          jumlah_stok: data.jumlah,
        },
      });
    }

    return tx.merchandise.findUnique({
      where: { id_merch },
      include: { stok: true },
    });
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
