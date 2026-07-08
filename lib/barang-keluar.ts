import { prisma } from "@/lib/prisma";
import { deleteEditLogsForTransaksi } from "@/lib/aktivitas-log-db";
import {
  normalizeDetailTujuan,
  validateDetailTujuan,
} from "@/lib/detail-tujuan";
import { barangKeluarListInclude } from "@/lib/prisma-selects";
import { getTujuanById } from "@/lib/tujuan";
import { Prisma } from "@prisma/client";
import { SortOrder } from "@/lib/sort";

export type BarangKeluarSortField =
  | "id_keluar"
  | "tanggal_keluar"
  | "nama_merch"
  | "nama_tujuan"
  | "jumlah";

const SORT_FIELDS: BarangKeluarSortField[] = [
  "id_keluar",
  "tanggal_keluar",
  "nama_merch",
  "nama_tujuan",
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
    case "nama_tujuan":
      return { tujuan: { nama_tujuan: sortOrder } };
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
      tujuan: {
        is: {
          nama_tujuan: { contains: term, mode: "insensitive" },
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
      unit: {
        is: {
          nama_unit: { contains: term, mode: "insensitive" },
        },
      },
    },
    {
      detail_teks: { contains: term, mode: "insensitive" },
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
  idTujuan,
}: {
  page: number;
  limit: number;
  search?: string;
  sortBy?: BarangKeluarSortField;
  sortOrder?: SortOrder;
  idTujuan?: number;
}) {
  const skip = (page - 1) * limit;

  const where: Prisma.BarangKeluarWhereInput = {
    ...buildSearchWhere(search),
  };

  if (idTujuan) where.id_tujuan = idTujuan;

  const [data, total] = await Promise.all([
    prisma.barangKeluar.findMany({
      where,
      include: barangKeluarListInclude,
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
    include: barangKeluarListInclude,
    orderBy: {
      tanggal_keluar: "desc",
    },
  });
}

export async function getBarangKeluarById(id: number) {
  return prisma.barangKeluar.findUnique({
    where: { id_keluar: id },
    include: barangKeluarListInclude,
  });
}

type BarangKeluarInput = {
  id_merch: number;
  id_tujuan: number;
  id_stasiun?: number | null;
  id_unit?: number | null;
  detail_teks?: string | null;
  jumlah: number;
  tanggal_keluar?: Date;
  keterangan?: string;
  bukti_path?: string | null;
  bukti_nama?: string | null;
};

async function validateBarangKeluarInput(data: BarangKeluarInput) {
  const tujuan = await getTujuanById(data.id_tujuan);
  if (!tujuan) {
    throw new Error("Tujuan tidak ditemukan");
  }

  const detailError = validateDetailTujuan(tujuan, data);
  if (detailError) {
    throw new Error(detailError);
  }

  return { tujuan, detail: normalizeDetailTujuan(tujuan.jenis_detail, data) };
}

export async function createBarangKeluar(
  data: BarangKeluarInput & { id_user: number }
) {
  const { detail } = await validateBarangKeluarInput(data);

  return prisma.$transaction(async (tx) => {
    const stok = await tx.stok.findUnique({
      where: { id_merch: data.id_merch },
    });

    if (!stok) {
      throw new Error("Data stok tidak ditemukan");
    }

    if (stok.jumlah_stok < data.jumlah) {
      throw new Error("Stok tidak mencukupi");
    }

    const tanggalKeluar = data.tanggal_keluar ?? new Date();

    const transaksi = await tx.barangKeluar.create({
      data: {
        id_merch: data.id_merch,
        id_tujuan: data.id_tujuan,
        id_user: data.id_user,
        id_stasiun: detail.id_stasiun,
        id_unit: detail.id_unit,
        detail_teks: detail.detail_teks,
        jumlah: data.jumlah,
        tanggal_keluar: tanggalKeluar,
        dicatat_pada: tanggalKeluar,
        keterangan: data.keterangan,
      },
    });

    await tx.stok.update({
      where: { id_merch: data.id_merch },
      data: {
        jumlah_stok: { decrement: data.jumlah },
      },
    });

    return transaksi;
  });
}

export async function updateBarangKeluar(id: number, data: BarangKeluarInput) {
  const { detail } = await validateBarangKeluarInput(data);

  return prisma.$transaction(async (tx) => {
    const transaksiLama = await tx.barangKeluar.findUnique({
      where: { id_keluar: id },
    });

    if (!transaksiLama) {
      throw new Error("Transaksi tidak ditemukan");
    }

    // abis ada pengembalian: edit metadata aja, tanpa ubah stok
    if (transaksiLama.jumlah_kembali > 0) {
      return tx.barangKeluar.update({
        where: { id_keluar: id },
        data: {
          id_tujuan: data.id_tujuan,
          id_stasiun: detail.id_stasiun,
          id_unit: detail.id_unit,  
          detail_teks: detail.detail_teks,
          tanggal_keluar: data.tanggal_keluar,
          keterangan: data.keterangan,
          ...(data.bukti_path !== undefined
            ? {
                bukti_path: data.bukti_path,
                bukti_nama: data.bukti_nama,
              }
            : {}),
        },
      });
    }

    await tx.stok.update({
      where: { id_merch: transaksiLama.id_merch },
      data: {
        jumlah_stok: { increment: transaksiLama.jumlah },
      },
    });

    const stokBaru = await tx.stok.findUnique({
      where: { id_merch: data.id_merch },
    });

    if (!stokBaru || stokBaru.jumlah_stok < data.jumlah) {
      throw new Error("Stok tidak mencukupi");
    }

    await tx.stok.update({
      where: { id_merch: data.id_merch },
      data: {
        jumlah_stok: { decrement: data.jumlah },
      },
    });

    return tx.barangKeluar.update({
      where: { id_keluar: id },
      data: {
        id_merch: data.id_merch,
        id_tujuan: data.id_tujuan,
        id_stasiun: detail.id_stasiun,
        id_unit: detail.id_unit,
        detail_teks: detail.detail_teks,
        jumlah: data.jumlah,
        tanggal_keluar: data.tanggal_keluar,
        keterangan: data.keterangan,
        ...(data.bukti_path !== undefined
          ? {
              bukti_path: data.bukti_path,
              bukti_nama: data.bukti_nama,
            }
          : {}),
      },
    });
  });
}

export async function deleteBarangKeluar(id: number) {
  return prisma.$transaction(async (tx) => {
    const transaksi = await tx.barangKeluar.findUnique({
      where: { id_keluar: id },
    });

    if (!transaksi) {
      throw new Error("Transaksi tidak ditemukan");
    }

    const netKeluar = transaksi.jumlah;

    await tx.stok.update({
      where: { id_merch: transaksi.id_merch },
      data: {
        jumlah_stok: { increment: netKeluar },
      },
    });

    await deleteEditLogsForTransaksi(id, tx);

    return tx.barangKeluar.delete({
      where: { id_keluar: id },
    });
  });
}

export async function getBarangKeluarSummary() {
  const [totalTransaksi, totalBarangKeluar, terpakaiPerMerch] = await Promise.all([
    prisma.barangKeluar.count(),
    prisma.barangKeluar.aggregate({ _sum: { jumlah: true } }),
    prisma.$queryRaw<{ id_merch: number; total_terpakai: number }[]>`
      SELECT
        id_merch,
        SUM(jumlah + jumlah_kembali)::int AS total_terpakai
      FROM "BarangKeluar"
      GROUP BY id_merch
      ORDER BY total_terpakai DESC
      LIMIT 1
    `,
  ]);

  let merchandiseTerbanyak: { nama: string; total: number } | null = null;

  if (terpakaiPerMerch.length > 0) {
    const top = terpakaiPerMerch[0];
    const merch = await prisma.merchandise.findUnique({
      where: { id_merch: top.id_merch },
      select: { nama_merch: true },
    });

    if (merch) {
      merchandiseTerbanyak = {
        nama: merch.nama_merch,
        total: top.total_terpakai,
      };
    }
  }

  return {
    totalTransaksi,
    totalBarangKeluar: totalBarangKeluar._sum.jumlah ?? 0,
    merchandiseTerbanyak,
  };
}
