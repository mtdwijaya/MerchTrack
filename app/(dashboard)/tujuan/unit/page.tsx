import { Suspense } from "react";

import TujuanUnitPageClient from "./unit-page-client";
import { requirePageAccess } from "@/lib/require-page";
import { getPageParam, getParam, type SearchParams } from "@/lib/list-params";
import { parseSortValue } from "@/lib/sort";
import {
  getUnitPaginated,
  getUnitSummary,
  parseUnitSort,
} from "@/lib/unit";

const PAGE_SIZE = 5;
const DEFAULT_SORT = "nama_unit:asc";

async function Content({ searchParams }: { searchParams: SearchParams }) {
  await requirePageAccess("unit");

  const page = getPageParam(searchParams);
  const search = getParam(searchParams, "search");
  const sort = getParam(searchParams, "sort", DEFAULT_SORT);
  const { sortBy, sortOrder } = parseSortValue(sort, "nama_unit");
  const parsed = parseUnitSort(sortBy, sortOrder);

  const [list, summary] = await Promise.all([
    getUnitPaginated({
      page,
      limit: PAGE_SIZE,
      search,
      sortBy: parsed.sortBy,
      sortOrder: parsed.sortOrder,
    }),
    getUnitSummary(),
  ]);

  return (
    <TujuanUnitPageClient
      list={list}
      summary={summary}
      pageSize={PAGE_SIZE}
      defaultSort={DEFAULT_SORT}
    />
  );
}

export default async function TujuanUnitPage({
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
      <Content searchParams={params} />
    </Suspense>
  );
}
