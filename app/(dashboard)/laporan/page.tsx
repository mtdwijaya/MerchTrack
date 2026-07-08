import { Suspense } from "react";

import LaporanPageClient from "./laporan-page-client";
import { getAllTujuan } from "@/lib/tujuan";
import {
  getOptionalNumberParam,
  getPageParam,
  getParam,
  type SearchParams,
} from "@/lib/list-params";
import {
  getRiwayatTransaksiPaginated,
  getRiwayatTransaksiSummary,
} from "@/lib/riwayat-transaksi";

const PAGE_SIZE = 5;

async function LaporanContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const page = getPageParam(searchParams);
  const search = getParam(searchParams, "search");
  const tanggal = getParam(searchParams, "tanggal");
  const idTujuan = getOptionalNumberParam(searchParams, "id_tujuan");

  const [list, summary, tujuanList] = await Promise.all([
    getRiwayatTransaksiPaginated({
      page,
      limit: PAGE_SIZE,
      search,
      sortBy: "tanggal_keluar",
      sortOrder: "desc",
      idTujuan,
      tanggal: tanggal || undefined,
    }),
    getRiwayatTransaksiSummary(),
    getAllTujuan(),
  ]);

  return (
    <LaporanPageClient
      list={list}
      summary={summary}
      tujuanList={tujuanList}
      pageSize={PAGE_SIZE}
    />
  );
}

export default async function LaporanPage({
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
      <LaporanContent searchParams={params} />
    </Suspense>
  );
}
