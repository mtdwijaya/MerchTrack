import { Suspense } from "react";

import PenggunaPageClient from "./pengguna-page-client";
import { requirePageAccess } from "@/lib/require-page";
import { getPageParam, getParam, type SearchParams } from "@/lib/list-params";
import {
  getPenggunaPaginated,
  parsePenggunaSort,
} from "@/lib/pengguna";
import { getAllStasiun } from "@/lib/stasiun";
import { getAllRolePermissions } from "@/lib/permissions";
import { parseSortValue } from "@/lib/sort";
import { Role } from "@prisma/client";

const PAGE_SIZE = 5;
const DEFAULT_SORT = "nama_user:asc";

async function PenggunaContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePageAccess("pengguna");

  const page = getPageParam(searchParams);
  const search = getParam(searchParams, "search");
  const role = getParam(searchParams, "role") as Role | "";
  const sort = getParam(searchParams, "sort", DEFAULT_SORT);
  const { sortBy, sortOrder } = parseSortValue(sort, "nama_user");
  const parsed = parsePenggunaSort(sortBy, sortOrder);

  const [list, stasiunList, rolePermissions] = await Promise.all([
    getPenggunaPaginated({
      page,
      limit: PAGE_SIZE,
      search,
      sortBy: parsed.sortBy,
      sortOrder: parsed.sortOrder,
      role: role || undefined,
    }),
    getAllStasiun(),
    getAllRolePermissions(),
  ]);

  return (
    <PenggunaPageClient
      list={list}
      stasiunList={stasiunList}
      rolePermissions={rolePermissions}
      pageSize={PAGE_SIZE}
      defaultSort={DEFAULT_SORT}
    />
  );
}

export default async function PenggunaPage({
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
      <PenggunaContent searchParams={params} />
    </Suspense>
  );
}
