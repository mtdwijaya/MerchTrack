"use server";

import { requireActionUser } from "@/lib/auth";
import {
  getRiwayatTransaksiPaginated,
  parseRiwayatSort,
} from "@/lib/riwayat-transaksi";
import { parseSortValue } from "@/lib/sort";

export async function exportRiwayatData(params: {
  search: string;
  sort: string;
  id_kategori?: number;
  tanggal?: string;
}) {
  const auth = await requireActionUser();
  if (!auth.ok) return [];

  const { sortBy, sortOrder } = parseSortValue(
    params.sort,
    "tanggal_keluar",
    "desc"
  );
  const parsed = parseRiwayatSort(sortBy, sortOrder);

  const result = await getRiwayatTransaksiPaginated({
    page: 1,
    limit: 10000,
    search: params.search,
    sortBy: parsed.sortBy,
    sortOrder: parsed.sortOrder,
    idKategori: params.id_kategori,
    tanggal: params.tanggal,
  });

  return result.data;
}
