import { Suspense } from "react";

import MerchandisePageClient from "./merchandise-page-client";
import { requireAdminPage } from "@/lib/auth";
import { getPageParam, getParam, type SearchParams } from "@/lib/list-params";
import {
  getMerchandisePaginated,
  getMerchandiseSummary,
  parseMerchandiseSort,
} from "@/lib/merchandise";
import { parseSortValue } from "@/lib/sort";

const PAGE_SIZE = 5;
const DEFAULT_SORT = "nama_merch:asc";

async function MerchandiseContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdminPage();

  const page = getPageParam(searchParams);
  const search = getParam(searchParams, "search");
  const sort = getParam(searchParams, "sort", DEFAULT_SORT);
  const { sortBy, sortOrder } = parseSortValue(sort, "nama_merch");
  const parsed = parseMerchandiseSort(sortBy, sortOrder);

  const [list, summary] = await Promise.all([
    getMerchandisePaginated({
      page,
      limit: PAGE_SIZE,
      search,
      sortBy: parsed.sortBy,
      sortOrder: parsed.sortOrder,
    }),
    getMerchandiseSummary(),
  ]);

  return (
    <MerchandisePageClient
      list={list}
      summary={summary}
      pageSize={PAGE_SIZE}
      defaultSort={DEFAULT_SORT}
    />
  );
}

export default async function MerchandisePage({
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
      <MerchandiseContent searchParams={params} />
    </Suspense>
  );
}
