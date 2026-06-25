import { Suspense } from "react";

import RiwayatPageClient from "./riwayat-page-client";
import { getAllKategori } from "@/lib/kategori";
import {
  getOptionalNumberParam,
  getPageParam,
  getParam,
  type SearchParams,
} from "@/lib/list-params";
import {
  getRiwayatTransaksiPaginated,
  getRiwayatTransaksiSummary,
  parseRiwayatSort,
} from "@/lib/riwayat-transaksi";
import { parseSortValue } from "@/lib/sort";

const PAGE_SIZE = 5;
const DEFAULT_SORT = "tanggal_keluar:desc";

async function RiwayatContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const page = getPageParam(searchParams);
  const search = getParam(searchParams, "search");
  const sort = getParam(searchParams, "sort", DEFAULT_SORT);
  const tanggal = getParam(searchParams, "tanggal");
  const idKategori = getOptionalNumberParam(searchParams, "id_kategori");
  const { sortBy, sortOrder } = parseSortValue(sort, "tanggal_keluar", "desc");
  const parsed = parseRiwayatSort(sortBy, sortOrder);

  const [list, summary, kategoriList] = await Promise.all([
    getRiwayatTransaksiPaginated({
      page,
      limit: PAGE_SIZE,
      search,
      sortBy: parsed.sortBy,
      sortOrder: parsed.sortOrder,
      idKategori,
      tanggal: tanggal || undefined,
    }),
    getRiwayatTransaksiSummary(),
    getAllKategori(),
  ]);

  return (
    <RiwayatPageClient
      list={list}
      summary={summary}
      kategoriList={kategoriList}
      pageSize={PAGE_SIZE}
      defaultSort={DEFAULT_SORT}
    />
  );
}

export default async function RiwayatTransaksiPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-sm text-gray-500">
          Memuat data...
        </div>
      }
    >
      <RiwayatContent searchParams={params} />
    </Suspense>
  );
}
