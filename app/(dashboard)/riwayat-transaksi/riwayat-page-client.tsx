"use client";

import { useState, useTransition } from "react";

import RiwayatSummary from "@/components/riwayat-transaksi/riwayat-summary";
import {
  DataTableSection,
  SortableTh,
  TableEmptyRow,
  Td,
} from "@/components/ui/data-table";
import {
  FilterBar,
  FilterDateRange,
  FilterSearch,
  FilterSelect,
} from "@/components/ui/filter-bar";
import PageHeader, { PrimaryButton, SecondaryButton } from "@/components/ui/page-header";
import Pagination from "@/components/ui/pagination";
import { useListFilters } from "@/hooks/use-list-filters";
import { formatTransaksiDate, formatTransaksiId } from "@/lib/format-transaksi";
import { parseSortValue, toggleSortValue } from "@/lib/sort";
import { showError } from "@/lib/toast";

import { exportRiwayatData } from "./actions";

type SortField =
  | "tanggal_keluar"
  | "nama_merch"
  | "nama_kategori"
  | "nama_stasiun"
  | "jumlah";

interface Props {
  list: {
    data: {
      id_keluar: number;
      jumlah: number;
      tanggal_keluar: string | Date;
      keterangan: string | null;
      merchandise: { nama_merch: string };
      kategori: { nama_kategori: string };
      stasiun: { nama_stasiun: string };
    }[];
    total: number;
    totalPages: number;
  };
  summary: {
    totalTransaksiBulanIni: number;
    totalBarangKeluar30Hari: number;
    stasiunTerpopuler: {
      nama_stasiun: string;
      totalDistribusi: number;
    } | null;
  };
  kategoriList: { id_kategori: number; nama_kategori: string }[];
  pageSize: number;
  defaultSort: string;
}

export default function RiwayatPageClient({
  list,
  summary,
  kategoriList,
  pageSize,
  defaultSort,
}: Props) {
  const [isPending] = useTransition();
  const {
    search,
    setSearch,
    page,
    sort,
    setParam,
    setPage,
    resetParams,
    getParam,
  } = useListFilters({ sort: defaultSort });

  const kategoriFilter = getParam("id_kategori");
  const tanggal = getParam("tanggal");
  const [exporting, setExporting] = useState(false);

  const currentSort = sort || defaultSort;
  const { sortBy, sortOrder } = parseSortValue<SortField>(
    currentSort,
    "tanggal_keluar",
    "desc"
  );

  async function handleExport() {
    try {
      setExporting(true);
      const data = await exportRiwayatData({
        search,
        sort: currentSort,
        id_kategori: kategoriFilter ? Number(kategoriFilter) : undefined,
        tanggal: tanggal || undefined,
      });

      const csv = [
        [
          "ID",
          "Tanggal",
          "Nama Barang",
          "Kategori",
          "Stasiun",
          "Jumlah",
          "Keterangan",
        ].join(","),
        ...data.map((item) =>
          [
            formatTransaksiId(item.id_keluar),
            formatTransaksiDate(String(item.tanggal_keluar)),
            `"${item.merchandise.nama_merch}"`,
            `"${item.kategori.nama_kategori}"`,
            `"${item.stasiun.nama_stasiun}"`,
            item.jumlah,
            `"${item.keterangan ?? ""}"`,
          ].join(",")
        ),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "riwayat-transaksi.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      showError("Gagal mengekspor data");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Riwayat Transaksi"
        description="Monitoring pergerakan distribusi merchandise seluruh stasiun."
        actions={
          <>
            <SecondaryButton onClick={handleExport} disabled={exporting}>
              {exporting ? "Mengekspor..." : "Ekspor Data"}
            </SecondaryButton>
            <PrimaryButton href="/barang-keluar?modal=tambah">
              Tambah Transaksi
            </PrimaryButton>
          </>
        }
      />

      <RiwayatSummary {...summary} />

      <FilterBar
        onReset={() =>
          resetParams(["search", "sort", "id_kategori", "tanggal"])
        }
      >
        <FilterSearch
          value={search}
          onChange={setSearch}
          placeholder="ID transaksi, nama barang..."
        />
        <FilterSelect
          id="filter-kategori-riwayat"
          label="Kategori"
          value={kategoriFilter}
          onChange={(value) => setParam("id_kategori", value)}
          placeholder="Pilih kategori..."
          options={kategoriList.map((item) => ({
            value: String(item.id_kategori),
            label: item.nama_kategori,
          }))}
        />
        <FilterDateRange
          value={tanggal}
          onChange={(value) => setParam("tanggal", value)}
          label="Tanggal"
        />
        <FilterSelect
          id="sort-riwayat"
          label="Urutkan"
          value={currentSort}
          onChange={(value) => setParam("sort", value)}
          placeholder="Pilih urutan..."
          options={[
            { value: "tanggal_keluar:desc", label: "Tanggal (Terbaru)" },
            { value: "nama_merch:asc", label: "Nama Barang (A-Z)" },
            { value: "jumlah:desc", label: "Jumlah (Terbesar)" },
          ]}
        />
      </FilterBar>

      <DataTableSection>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#EFEAE5] bg-[#FAFAFA]">
              <SortableTh
                label="Tanggal & Waktu"
                field="tanggal_keluar"
                activeField={sortBy}
                activeOrder={sortOrder}
                onSort={(f) =>
                  setParam("sort", toggleSortValue(currentSort, f))
                }
              />
              <SortableTh
                label="Nama Barang"
                field="nama_merch"
                activeField={sortBy}
                activeOrder={sortOrder}
                onSort={(f) =>
                  setParam("sort", toggleSortValue(currentSort, f))
                }
              />
              <SortableTh
                label="Kategori"
                field="nama_kategori"
                activeField={sortBy}
                activeOrder={sortOrder}
                onSort={(f) =>
                  setParam("sort", toggleSortValue(currentSort, f))
                }
              />
              <SortableTh
                label="Stasiun/Lokasi"
                field="nama_stasiun"
                activeField={sortBy}
                activeOrder={sortOrder}
                onSort={(f) =>
                  setParam("sort", toggleSortValue(currentSort, f))
                }
              />
              <SortableTh
                label="Jumlah"
                field="jumlah"
                activeField={sortBy}
                activeOrder={sortOrder}
                onSort={(f) =>
                  setParam("sort", toggleSortValue(currentSort, f))
                }
              />
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                Keterangan
              </th>
            </tr>
          </thead>
          <tbody>
            {isPending ? (
              <TableEmptyRow colSpan={6} message="Memuat data..." />
            ) : list.data.length === 0 ? (
              <TableEmptyRow colSpan={6} message="Tidak ada transaksi ditemukan" />
            ) : (
              list.data.map((item) => (
                <tr
                  key={item.id_keluar}
                  className="border-b border-[#EFEAE5] hover:bg-gray-50/60"
                >
                  <Td>{formatTransaksiDate(String(item.tanggal_keluar))}</Td>
                  <Td>{item.merchandise.nama_merch}</Td>
                  <Td>{item.kategori.nama_kategori}</Td>
                  <Td>{item.stasiun.nama_stasiun}</Td>
                  <Td>{item.jumlah.toLocaleString("id-ID")}</Td>
                  <Td className="max-w-xs truncate">
                    {item.keterangan || "-"}
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {list.total > 0 && (
          <div className="border-t border-[#EFEAE5] px-5 py-4">
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
  );
}
