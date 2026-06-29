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

export default async function StasiunPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdminPage();

  const params = await searchParams;
  const page = getPageParam(params);
  const search = getParam(params, "search");
  const sort = getParam(params, "sort", DEFAULT_SORT);
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
    <Suspense
      fallback={
        <div className="py-20 text-center text-sm text-gray-500">
          Memuat data...
        </div>
      }
    >
      <StasiunPageClient
        list={list}
        summary={summary}
        pageSize={PAGE_SIZE}
        defaultSort={DEFAULT_SORT}
      />
    </Suspense>
  );
}
