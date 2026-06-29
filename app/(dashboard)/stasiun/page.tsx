import { Suspense } from "react";

import StasiunPageClient from "./stasiun-page-client";
import { requireAdminPage } from "@/lib/auth";
import { getPageParam, getParam, type SearchParams } from "@/lib/list-params";
import { parseSortValue } from "@/lib/sort";
import {
  getStasiunPaginated,
  getStasiunSummary,
  parseStasiunSort,
} from "@/lib/stasiun";

const PAGE_SIZE = 5;
const DEFAULT_SORT = "nama_stasiun:asc";

async function StasiunContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdminPage();

  const page = getPageParam(searchParams);
  const search = getParam(searchParams, "search");
  const sort = getParam(searchParams, "sort", DEFAULT_SORT);
  const { sortBy, sortOrder } = parseSortValue(sort, "nama_stasiun");
  const parsed = parseStasiunSort(sortBy, sortOrder);

  const [list, summary] = await Promise.all([
    getStasiunPaginated({
      page,
      limit: PAGE_SIZE,
      search,
      sortBy: parsed.sortBy,
      sortOrder: parsed.sortOrder,
    }),
    getStasiunSummary(),
  ]);

  return (
    <StasiunPageClient
      list={list}
      summary={summary}
      pageSize={PAGE_SIZE}
      defaultSort={DEFAULT_SORT}
    />
  );
}

export default async function StasiunPage({
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
      <StasiunContent searchParams={params} />
    </Suspense>
  );
}
