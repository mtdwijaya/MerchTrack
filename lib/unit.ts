import { revalidateTag, unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const UNIT_CACHE_TAG = "unit";

export type UnitSortField = "kode_unit" | "nama_unit";
export type SortOrder = "asc" | "desc";

const SORT_FIELDS: UnitSortField[] = ["kode_unit", "nama_unit"];

export function parseUnitSort(
  sortBy?: string | null,
  sortOrder?: string | null
): { sortBy: UnitSortField; sortOrder: SortOrder } {
  const field = SORT_FIELDS.includes(sortBy as UnitSortField)
    ? (sortBy as UnitSortField)
    : "nama_unit";
  const order: SortOrder = sortOrder === "desc" ? "desc" : "asc";
  return { sortBy: field, sortOrder: order };
}

export async function getUnitPaginated({
  page,
  limit,
  search,
  sortBy = "nama_unit",
  sortOrder = "asc",
}: {
  page: number;
  limit: number;
  search?: string;
  sortBy?: UnitSortField;
  sortOrder?: SortOrder;
}) {
  const skip = (page - 1) * limit;

  const where: Prisma.UnitWhereInput =
    search && search.trim() !== ""
      ? {
          OR: [
            { kode_unit: { contains: search, mode: "insensitive" } },
            { nama_unit: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

  const [data, total] = await Promise.all([
    prisma.unit.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.unit.count({ where }),
  ]);

  return {
    data,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

async function fetchAllUnit() {
  return prisma.unit.findMany({
    orderBy: { nama_unit: "asc" },
  });
}

export const getAllUnit = unstable_cache(fetchAllUnit, ["all-unit"], {
  tags: [UNIT_CACHE_TAG],
});

export function revalidateUnitCache() {
  revalidateTag(UNIT_CACHE_TAG, "max");
}

export async function getUnitById(id: number) {
  return prisma.unit.findUnique({ where: { id_unit: id } });
}

export async function createUnit(data: {
  kode_unit: string;
  nama_unit: string;
}) {
  const existing = await prisma.unit.findUnique({
    where: { kode_unit: data.kode_unit },
  });
  if (existing) {
    throw new Error("Kode unit sudah digunakan");
  }

  return prisma.unit.create({ data });
}

export async function updateUnit(
  id: number,
  data: { kode_unit: string; nama_unit: string }
) {
  const existing = await prisma.unit.findFirst({
    where: {
      kode_unit: data.kode_unit,
      NOT: { id_unit: id },
    },
  });
  if (existing) {
    throw new Error("Kode unit sudah digunakan");
  }

  return prisma.unit.update({
    where: { id_unit: id },
    data,
  });
}

export async function deleteUnit(id: number) {
  const unit = await prisma.unit.findUnique({
    where: { id_unit: id },
    include: {
      _count: { select: { barangKeluar: true } },
    },
  });

  if (!unit) {
    throw new Error("Unit tidak ditemukan");
  }

  if (unit._count.barangKeluar > 0) {
    throw new Error(
      "Unit tidak dapat dihapus karena masih digunakan di transaksi barang keluar"
    );
  }

  return prisma.unit.delete({ where: { id_unit: id } });
}

export async function getUnitSummary() {
  const [totalUnit, unitWithTransaksi] = await Promise.all([
    prisma.unit.count(),
    prisma.barangKeluar.groupBy({ by: ["id_unit"] }),
  ]);

  return {
    totalUnit,
    unitAktif: unitWithTransaksi.filter((item) => item.id_unit != null).length,
  };
}
