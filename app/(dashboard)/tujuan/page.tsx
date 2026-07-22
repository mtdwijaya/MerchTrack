import { Suspense } from "react";
import type { JenisDetailTujuan } from "@prisma/client";

import TujuanPageClient from "./tujuan-page-client";
import { requirePageAccess } from "@/lib/require-page";
import { getPageParam, getParam, type SearchParams } from "@/lib/list-params";
import { parseSortValue } from "@/lib/sort";
import {
  getTujuanPaginated,
  getTujuanSummary,
  parseTujuanSort,
} from "@/lib/tujuan";

const PAGE_SIZE = 5;
const DEFAULT_SORT = "nama_tujuan:asc";

const JENIS_VALUES = new Set(["STASIUN", "UNIT", "TEKS", "TIDAK_ADA"]);

async function TujuanContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePageAccess("tujuan");

  const page = getPageParam(searchParams);
  const search = getParam(searchParams, "search");
  const sort = getParam(searchParams, "sort", DEFAULT_SORT);
  const jenisRaw = getParam(searchParams, "jenis_detail");
  const jenisDetail = JENIS_VALUES.has(jenisRaw)
    ? (jenisRaw as JenisDetailTujuan)
    : undefined;

  const { sortBy, sortOrder } = parseSortValue(sort, "nama_tujuan");
  const parsed = parseTujuanSort(sortBy, sortOrder);

  const [list, summary] = await Promise.all([
    getTujuanPaginated({
      page,
      limit: PAGE_SIZE,
      search,
      sortBy: parsed.sortBy,
      sortOrder: parsed.sortOrder,
      jenisDetail,
    }),
    getTujuanSummary(),
  ]);

  return (
    <TujuanPageClient
      list={list}
      summary={summary}
      pageSize={PAGE_SIZE}
      defaultSort={DEFAULT_SORT}
    />
  );
}

export default async function TujuanPage({
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
      <TujuanContent searchParams={params} />
    </Suspense>
  );
}
