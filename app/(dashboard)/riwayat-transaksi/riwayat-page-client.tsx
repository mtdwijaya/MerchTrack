"use client";

import { useState, useTransition } from "react";

import RiwayatDetailDialog from "@/components/riwayat-transaksi/riwayat-detail-dialog";
import RiwayatSummary from "@/components/riwayat-transaksi/riwayat-summary";
import {
  DataTable,
  DataTableSection,
  TableEmptyRow,
  Td,
  Th,
} from "@/components/ui/data-table";
import {
  FilterBar,
  FilterDateRange,
  FilterSearch,
  FilterSelect,
} from "@/components/ui/filter-bar";
import PageHeader, { PrimaryButton } from "@/components/ui/page-header";
import Pagination from "@/components/ui/pagination";
import { DetailsAction } from "@/components/ui/table-actions";
import { useListFilters } from "@/hooks/use-list-filters";
import { formatTransaksiDate } from "@/lib/format-transaksi";
import type { RiwayatJenis, RiwayatUnifiedItem } from "@/lib/riwayat-transaksi";

interface Props {
  list: {
    data: RiwayatUnifiedItem[];
    total: number;
    totalPages: number;
  };
  summary: {
    transaksiMasukBulanIni: number;
    transaksiKeluarBulanIni: number;
    totalBarangKeluarBulanIni: number;
    totalBarangMasukBulanIni: number;
  };
  pageSize: number;
}

function JenisBadge({ jenis }: { jenis: RiwayatJenis }) {
  const styles =
    jenis === "KELUAR"
      ? "bg-[#FFF5F5] text-[#D32F2F]"
      : "bg-emerald-50 text-emerald-700";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles}`}
    >
      {jenis === "KELUAR" ? "Barang Keluar" : "Barang Masuk"}
    </span>
  );
}

export default function RiwayatPageClient({ list, summary, pageSize }: Props) {
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

  const tanggal = getParam("tanggal");
  const jenisFilter = getParam("jenis");
  const [detail, setDetail] = useState<{
    jenis: RiwayatJenis;
    id: number;
  } | null>(null);

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Riwayat Transaksi"
          description="Gabungan transaksi barang keluar dan barang masuk (restock)."
          actions={
            <PrimaryButton href="/barang-keluar?modal=tambah">
              Tambah Transaksi
            </PrimaryButton>
          }
        />

        <RiwayatSummary {...summary} />

        <FilterBar
          onReset={() => resetParams(["search", "jenis", "tanggal"])}
        >
          <FilterSearch
            value={search}
            onChange={setSearch}
            placeholder="ID, nama barang, petugas..."
          />
          <FilterSelect
            id="filter-jenis-riwayat"
            label="Jenis"
            value={jenisFilter}
            onChange={(value) => setParam("jenis", value)}
            placeholder="Semua jenis"
            options={[
              { value: "KELUAR", label: "Barang Keluar" },
              { value: "MASUK", label: "Barang Masuk" },
            ]}
          />
          <FilterDateRange
            value={tanggal}
            onChange={(value) => setParam("tanggal", value)}
            label="Tanggal"
          />
        </FilterBar>

        <DataTableSection>
          <DataTable>
            <thead>
              <tr className="border-b border-[#E8E4DF] bg-[#FAFAF8]">
                <Th>Tanggal</Th>
                <Th>Jenis</Th>
                <Th>Merchandise</Th>
                <Th align="center">Jumlah</Th>
                <Th>Keterangan</Th>
                <Th>Petugas</Th>
                <Th align="center">Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {isPending ? (
                <TableEmptyRow colSpan={7} message="Memuat data..." />
              ) : list.data.length === 0 ? (
                <TableEmptyRow colSpan={7} message="Tidak ada transaksi" />
              ) : (
                list.data.map((item) => (
                  <tr
                    key={item.key}
                    className="border-b border-[#E8E4DF] last:border-b-0 hover:bg-[#FAFAF8]/80"
                  >
                    <Td variant="numeric" align="left">
                      {formatTransaksiDate(item.tanggal.toISOString())}
                    </Td>
                    <Td>
                      <JenisBadge jenis={item.jenis} />
                    </Td>
                    <Td variant="truncate">{item.merchandise}</Td>
                    <Td variant="numeric" align="center">
                      {item.jumlah.toLocaleString("id-ID")}
                    </Td>
                    <Td variant="truncate">{item.info}</Td>
                    <Td variant="truncate">{item.petugas}</Td>
                    <Td variant="action" align="center">
                      <DetailsAction
                        label="Detail"
                        onClick={() =>
                          setDetail({ jenis: item.jenis, id: item.id })
                        }
                      />
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </DataTable>

          {list.total > 0 && (
            <div className="border-t border-[#E8E4DF] px-6 py-4">
              <Pagination
                currentPage={page}
                totalPages={list.totalPages}
                totalItems={list.total}
                pageSize={pageSize}
                itemLabel="transaksi"
                onPageChange={setPage}
              />
            </div>
          )}
        </DataTableSection>
      </div>

      <RiwayatDetailDialog
        jenis={detail?.jenis ?? null}
        id={detail?.id ?? null}
        open={detail !== null}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      />
    </>
  );
}
