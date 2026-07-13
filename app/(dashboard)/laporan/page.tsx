import { Suspense } from "react";

import LaporanPageClient from "./laporan-page-client";
import { getAllMerchandiseNames } from "@/lib/merchandise";
import { getRiwayatTransaksiSummary } from "@/lib/riwayat-transaksi";

async function LaporanContent() {
  const [summary, merchandiseList] = await Promise.all([
    getRiwayatTransaksiSummary(),
    getAllMerchandiseNames(),
  ]);

  return (
    <LaporanPageClient
      summary={summary}
      merchandiseList={merchandiseList}
    />
  );
}

export default function LaporanPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-sm text-gray-500">
          Memuat data...
        </div>
      }
    >
      <LaporanContent />
    </Suspense>
  );
}
