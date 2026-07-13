import { revalidateTag, unstable_cache } from "next/cache";
import type { JenisDetailTujuan, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export {
  getTujuanSubHref,
  hasTujuanSubList,
  JENIS_DETAIL_LABEL,
} from "@/lib/tujuan-shared";

export const TUJUAN_CACHE_TAG = "tujuan";

export type TujuanSortField = "nama_tujuan" | "jenis_detail";
export type SortOrder = "asc" | "desc";

const SORT_FIELDS: TujuanSortField[] = ["nama_tujuan", "jenis_detail"];

export function parseTujuanSort(
  sortBy?: string | null,
  sortOrder?: string | null
): { sortBy: TujuanSortField; sortOrder: SortOrder } {
  const field = SORT_FIELDS.includes(sortBy as TujuanSortField)
    ? (sortBy as TujuanSortField)
    : "nama_tujuan";
  const order: SortOrder = sortOrder === "desc" ? "desc" : "asc";
  return { sortBy: field, sortOrder: order };
}

export async function getTujuanPaginated({
  page,
  limit,
  search,
  sortBy = "nama_tujuan",
  sortOrder = "asc",
  jenisDetail,
}: {
  page: number;
  limit: number;
  search?: string;
  sortBy?: TujuanSortField;
  sortOrder?: SortOrder;
  jenisDetail?: JenisDetailTujuan;
}) {
  const skip = (page - 1) * limit;

  const where: Prisma.TujuanWhereInput = {
    ...(jenisDetail ? { jenis_detail: jenisDetail } : {}),
    ...(search && search.trim() !== ""
      ? {
          OR: [
            { nama_tujuan: { contains: search, mode: "insensitive" } },
            { label_detail: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.tujuan.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
      include: {
        _count: { select: { barangKeluar: true } },
      },
    }),
    prisma.tujuan.count({ where }),
  ]);

  return {
    data,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

async function fetchAllTujuan() {
  return prisma.tujuan.findMany({
    orderBy: { nama_tujuan: "asc" },
  });
}

export const getAllTujuan = unstable_cache(fetchAllTujuan, ["all-tujuan"], {
  tags: [TUJUAN_CACHE_TAG],
});

export async function getTujuanById(id: number) {
  return prisma.tujuan.findUnique({ where: { id_tujuan: id } });
}

export function revalidateTujuanCache() {
  revalidateTag(TUJUAN_CACHE_TAG, "max");
}

export async function createTujuan(data: {
  nama_tujuan: string;
  jenis_detail: JenisDetailTujuan;
  label_detail?: string | null;
  boleh_return: boolean;
}) {
  const existing = await prisma.tujuan.findUnique({
    where: { nama_tujuan: data.nama_tujuan },
  });
  if (existing) {
    throw new Error("Nama tujuan sudah digunakan");
  }

  return prisma.tujuan.create({
    data: {
      nama_tujuan: data.nama_tujuan,
      jenis_detail: data.jenis_detail,
      label_detail: data.label_detail || null,
      boleh_return: data.boleh_return,
    },
  });
}

export async function updateTujuan(
  id: number,
  data: {
    nama_tujuan: string;
    jenis_detail: JenisDetailTujuan;
    label_detail?: string | null;
    boleh_return: boolean;
  }
) {
  const existing = await prisma.tujuan.findFirst({
    where: {
      nama_tujuan: data.nama_tujuan,
      NOT: { id_tujuan: id },
    },
  });
  if (existing) {
    throw new Error("Nama tujuan sudah digunakan");
  }

  return prisma.tujuan.update({
    where: { id_tujuan: id },
    data: {
      nama_tujuan: data.nama_tujuan,
      jenis_detail: data.jenis_detail,
      label_detail: data.label_detail || null,
      boleh_return: data.boleh_return,
    },
  });
}

export async function deleteTujuan(id: number) {
  const tujuan = await prisma.tujuan.findUnique({
    where: { id_tujuan: id },
    include: {
      _count: { select: { barangKeluar: true } },
    },
  });

  if (!tujuan) {
    throw new Error("Tujuan tidak ditemukan");
  }

  if (tujuan._count.barangKeluar > 0) {
    throw new Error(
      "Tujuan tidak dapat dihapus karena masih digunakan di transaksi barang keluar"
    );
  }

  return prisma.tujuan.delete({ where: { id_tujuan: id } });
}

export async function getTujuanSummary() {
  const [totalTujuan, withSub, bolehReturn] = await Promise.all([
    prisma.tujuan.count(),
    prisma.tujuan.count({
      where: { jenis_detail: { in: ["STASIUN", "UNIT"] } },
    }),
    prisma.tujuan.count({ where: { boleh_return: true } }),
  ]);

  return {
    totalTujuan,
    denganSubList: withSub,
    bolehReturn,
  };
}
