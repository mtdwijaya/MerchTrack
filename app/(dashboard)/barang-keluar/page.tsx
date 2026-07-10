import { Suspense } from "react";

import BarangKeluarPageClient from "./barang-keluar-page-client";
import { getBarangKeluarGroupedPaginated } from "@/lib/barang-keluar-group";
import {
  getBarangKeluarSummary,
  parseBarangKeluarSort,
} from "@/lib/barang-keluar";
import { getAllMerchandiseNames } from "@/lib/merchandise";
import {
  getOptionalNumberParam,
  getPageParam,
  getParam,
  type SearchParams,
} from "@/lib/list-params";
import { parseSortValue } from "@/lib/sort";
import { getAllStasiun } from "@/lib/stasiun";
import { getAllTujuan } from "@/lib/tujuan";
import { getAllUnit } from "@/lib/unit";

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
  const idTujuan = getOptionalNumberParam(searchParams, "id_tujuan");
  const { sortBy, sortOrder } = parseSortValue(sort, "tanggal_keluar", "desc");
  const parsed = parseBarangKeluarSort(sortBy, sortOrder);

  const [list, summary, merchandiseList, stasiunList, tujuanList, unitList] =
    await Promise.all([
      getBarangKeluarGroupedPaginated({
        page,
        limit: PAGE_SIZE,
        search,
        sortBy: parsed.sortBy,
        sortOrder: parsed.sortOrder,
        idTujuan,
      }),
      getBarangKeluarSummary(),
      getAllMerchandiseNames(),
      getAllStasiun(),
      getAllTujuan(),
      getAllUnit(),
    ]);

  return (
    <BarangKeluarPageClient
      list={list}
      summary={summary}
      merchandiseList={merchandiseList}
      stasiunList={stasiunList}
      tujuanList={tujuanList}
      unitList={unitList}
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
