import { Suspense } from "react";

import BarangKeluarPageClient from "./barang-keluar-page-client";
import {
  getBarangKeluarPaginated,
  getBarangKeluarSummary,
  parseBarangKeluarSort,
} from "@/lib/barang-keluar";
import { getAllKategori } from "@/lib/kategori";
import {
  getOptionalNumberParam,
  getPageParam,
  getParam,
  type SearchParams,
} from "@/lib/list-params";
import { getAllMerchandiseNames } from "@/lib/merchandise";
import { parseSortValue } from "@/lib/sort";
import { getAllStasiun } from "@/lib/stasiun";

const PAGE_SIZE = 10;
const DEFAULT_SORT = "tanggal_keluar:desc";

async function BarangKeluarContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const page = getPageParam(searchParams);
  const search = getParam(searchParams, "search");
  const sort = getParam(searchParams, "sort", DEFAULT_SORT);
  const idStasiun = getOptionalNumberParam(searchParams, "id_stasiun");
  const idKategori = getOptionalNumberParam(searchParams, "id_kategori");
  const { sortBy, sortOrder } = parseSortValue(sort, "tanggal_keluar", "desc");
  const parsed = parseBarangKeluarSort(sortBy, sortOrder);

  const [list, summary, merchandiseList, stasiunList, kategoriList] =
    await Promise.all([
      getBarangKeluarPaginated({
        page,
        limit: PAGE_SIZE,
        search,
        sortBy: parsed.sortBy,
        sortOrder: parsed.sortOrder,
        idStasiun,
        idKategori,
      }),
      getBarangKeluarSummary(),
      getAllMerchandiseNames(),
      getAllStasiun(),
      getAllKategori(),
    ]);

  return (
    <BarangKeluarPageClient
      list={list}
      summary={summary}
      merchandiseList={merchandiseList}
      stasiunList={stasiunList}
      kategoriList={kategoriList}
      pageSize={PAGE_SIZE}
      defaultSort={DEFAULT_SORT}
      openModal={getParam(searchParams, "modal") === "tambah"}
    />
  );
}

export default async function BarangKeluarPage({
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
      <BarangKeluarContent searchParams={params} />
    </Suspense>
  );
}
