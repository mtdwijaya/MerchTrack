"use client";

import { useState, useTransition } from "react";

import LaporanCard, {
  type LaporanCardItem,
} from "@/components/laporan/laporan-card";
import LaporanPdfPreviewDialog from "@/components/laporan/laporan-pdf-preview-dialog";
import RiwayatSummary from "@/components/riwayat-transaksi/riwayat-summary";
import {
  FilterBar,
  FilterDateRange,
  FilterSearch,
  FilterSelect,
} from "@/components/ui/filter-bar";
import PageHeader, { PrimaryButton } from "@/components/ui/page-header";
import Pagination from "@/components/ui/pagination";
import { useListFilters } from "@/hooks/use-list-filters";

interface Props {
  list: {
    data: LaporanCardItem[];
    total: number;
    totalPages: number;
  };
  summary: {
    totalTransaksiBulanIni: number;
    totalBarangKeluar30Hari: number;
    tujuanTerpopuler: {
      nama_tujuan: string;
      totalDistribusi: number;
    } | null;
  };
  tujuanList: { id_tujuan: number; nama_tujuan: string }[];
  pageSize: number;
}

export default function LaporanPageClient({
  list,
  summary,
  tujuanList,
  pageSize,
}: Props) {
  const [isPending] = useTransition();
  const {
    search,
    setSearch,
    page,
    setParam,
    setPage,
    resetParams,
    getParam,
  } = useListFilters({});

  const tujuanFilter = getParam("id_tujuan");
  const tanggal = getParam("tanggal");
  const [previewId, setPreviewId] = useState<number | null>(null);

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Laporan"
          description="Dokumentasi dan rekap transaksi barang keluar."
          actions={
            <PrimaryButton href="/barang-keluar?modal=tambah">
              Tambah Transaksi
            </PrimaryButton>
          }
        />

        <RiwayatSummary {...summary} variant="laporan" />

        <FilterBar
          onReset={() => resetParams(["search", "id_tujuan", "tanggal"])}
        >
          <FilterSearch
            value={search}
            onChange={setSearch}
            placeholder="ID transaksi, nama barang..."
          />
          <FilterSelect
            id="filter-tujuan-laporan"
            label="Tujuan"
            value={tujuanFilter}
            onChange={(value) => setParam("id_tujuan", value)}
            placeholder="Semua tujuan"
            options={tujuanList.map((item) => ({
              value: String(item.id_tujuan),
              label: item.nama_tujuan,
            }))}
          />
          <FilterDateRange
            value={tanggal}
            onChange={(value) => setParam("tanggal", value)}
            label="Tanggal"
          />
        </FilterBar>

        <div className="space-y-4">
          {isPending ? (
            <div className="rounded-2xl border border-[#EFEAE5] bg-white py-16 text-center text-sm text-[#6B7280]">
              Memuat data...
            </div>
          ) : list.data.length === 0 ? (
            <div className="rounded-2xl border border-[#EFEAE5] bg-white py-16 text-center text-sm text-[#6B7280]">
              Tidak ada laporan transaksi
            </div>
          ) : (
            list.data.map((item) => (
              <LaporanCard
                key={item.id_keluar}
                item={item}
                onPreview={setPreviewId}
              />
            ))
          )}
        </div>

        {list.total > 0 && (
          <Pagination
            currentPage={page}
            totalPages={list.totalPages}
            totalItems={list.total}
            pageSize={pageSize}
            itemLabel="laporan"
            onPageChange={setPage}
          />
        )}
      </div>

      <LaporanPdfPreviewDialog
        id={previewId}
        open={previewId !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewId(null);
        }}
      />
    </>
  );
}
