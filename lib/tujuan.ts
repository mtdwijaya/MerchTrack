import { revalidateTag, unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";

export const TUJUAN_CACHE_TAG = "tujuan";

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
