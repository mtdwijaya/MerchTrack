import { revalidateTag, unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";

export const KATEGORI_CACHE_TAG = "kategori";

// daftar kategori penggunaan untuk form barang keluar — di-cache
async function fetchAllKategori() {
  return prisma.kategoriPenggunaan.findMany({
    orderBy: { nama_kategori: "asc" },
  });
}

export const getAllKategori = unstable_cache(
  fetchAllKategori,
  ["all-kategori"],
  { tags: [KATEGORI_CACHE_TAG] }
);

export function revalidateKategoriCache() {
  revalidateTag(KATEGORI_CACHE_TAG, "max");
}
