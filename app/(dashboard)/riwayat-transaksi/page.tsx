import { Suspense } from "react";

import RiwayatPageClient from "./riwayat-page-client";
import {
  getPageParam,
  getParam,
  type SearchParams,
} from "@/lib/list-params";
import {
  getRiwayatUnifiedPaginated,
  getRiwayatUnifiedSummary,
  type RiwayatJenis,
} from "@/lib/riwayat-transaksi";

const PAGE_SIZE = 8;

async function RiwayatContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const page = getPageParam(searchParams);
  const search = getParam(searchParams, "search");
  const tanggal = getParam(searchParams, "tanggal");
  const jenis = getParam(searchParams, "jenis") as RiwayatJenis | "";

  const [list, summary] = await Promise.all([
    getRiwayatUnifiedPaginated({
      page,
      limit: PAGE_SIZE,
      search,
      jenis,
      tanggal: tanggal || undefined,
    }),
    getRiwayatUnifiedSummary(),
  ]);

  return (
    <RiwayatPageClient
      list={list}
      summary={summary}
      pageSize={PAGE_SIZE}
    />
  );
}

export default async function RiwayatTransaksiPage({
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
      <RiwayatContent searchParams={params} />
    </Suspense>
  );
}
