import { Suspense } from "react";

import RiwayatPageClient from "./riwayat-page-client";
import {
  getPageParam,
  getParam,
  type SearchParams,
} from "@/lib/list-params";
import { getAllMerchandiseNames } from "@/lib/merchandise";
import {
  getRiwayatUnifiedPaginated,
  type RiwayatJenis,
} from "@/lib/riwayat-transaksi";

const PAGE_SIZE = 8;

function parseIdMerch(value: string): number | undefined {
  if (!value) return undefined;
  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : undefined;
}

async function RiwayatContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const page = getPageParam(searchParams);
  const search = getParam(searchParams, "search");
  const tanggalDari = getParam(searchParams, "tanggal_dari");
  const tanggalSampai = getParam(searchParams, "tanggal_sampai");
  const jenis = getParam(searchParams, "jenis") as RiwayatJenis | "";
  const idMerch = parseIdMerch(getParam(searchParams, "id_merch"));

  const [list, merchandiseList] = await Promise.all([
    getRiwayatUnifiedPaginated({
      page,
      limit: PAGE_SIZE,
      search,
      jenis,
      idMerch,
      tanggalDari: tanggalDari || undefined,
      tanggalSampai: tanggalSampai || undefined,
    }),
    getAllMerchandiseNames(),
  ]);

  return (
    <RiwayatPageClient
      list={list}
      merchandiseList={merchandiseList}
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
