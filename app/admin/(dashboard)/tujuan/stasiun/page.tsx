import { Suspense } from "react";

import TujuanStasiunPageClient from "./stasiun-page-client";
import { requirePageAccess } from "@/lib/require-page";
import { getPageParam, getParam, type SearchParams } from "@/lib/list-params";
import { parseSortValue } from "@/lib/sort";
import {
  getStasiunPaginated,
  parseStasiunSort,
} from "@/lib/stasiun";

const PAGE_SIZE = 5;
const DEFAULT_SORT = "nama_stasiun:asc";

async function Content({ searchParams }: { searchParams: SearchParams }) {
  await requirePageAccess("stasiun");

  const page = getPageParam(searchParams);
  const search = getParam(searchParams, "search");
  const sort = getParam(searchParams, "sort", DEFAULT_SORT);
  const { sortBy, sortOrder } = parseSortValue(sort, "nama_stasiun");
  const parsed = parseStasiunSort(sortBy, sortOrder);

  const list = await getStasiunPaginated({
    page,
    limit: PAGE_SIZE,
    search,
    sortBy: parsed.sortBy,
    sortOrder: parsed.sortOrder,
  });

  return (
    <TujuanStasiunPageClient
      list={list}
      pageSize={PAGE_SIZE}
      defaultSort={DEFAULT_SORT}
    />
  );
}

export default async function TujuanStasiunPage({
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
