import { Suspense } from "react";

import PenggunaPageClient from "./pengguna-page-client";
import { requireAdminPage } from "@/lib/auth";
import { getPageParam, getParam, type SearchParams } from "@/lib/list-params";
import {
  getPenggunaPaginated,
  getPenggunaSummary,
  parsePenggunaSort,
} from "@/lib/pengguna";
import { getAllStasiun } from "@/lib/stasiun";
import { parseSortValue } from "@/lib/sort";
import { Role } from "@prisma/client";

const PAGE_SIZE = 5;
const DEFAULT_SORT = "nama_user:asc";

export default async function PenggunaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdminPage();

  const params = await searchParams;
  const page = getPageParam(params);
  const search = getParam(params, "search");
  const role = getParam(params, "role") as Role | "";
  const sort = getParam(params, "sort", DEFAULT_SORT);
  const { sortBy, sortOrder } = parseSortValue(sort, "nama_user");
  const parsed = parsePenggunaSort(sortBy, sortOrder);

  const [list, summary, stasiunList] = await Promise.all([
    getPenggunaPaginated({
      page,
      limit: PAGE_SIZE,
      search,
      sortBy: parsed.sortBy,
      sortOrder: parsed.sortOrder,
      role: role || undefined,
    }),
    getPenggunaSummary(),
    getAllStasiun(),
  ]);

  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-sm text-gray-500">
          Memuat data...
        </div>
      }
    >
      <PenggunaPageClient
        list={list}
        summary={summary}
        stasiunList={stasiunList}
        pageSize={PAGE_SIZE}
        defaultSort={DEFAULT_SORT}
      />
    </Suspense>
  );
}
