"use client";

import { useCallback, useEffect, useState } from "react";

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
import { useDebounce } from "@/hooks/use-debounce";
import { formatTransaksiDate, formatTransaksiId } from "@/lib/format-transaksi";
import { parseSortValue, toggleSortValue } from "@/lib/sort";

interface RiwayatItem {
  id_keluar: number;
  jumlah: number;
  tanggal_keluar: string;
  keterangan: string | null;
  merchandise: { nama_merch: string };
  kategori: { nama_kategori: string };
  stasiun: { nama_stasiun: string };
}

type SortField = "id_keluar" | "tanggal_keluar" | "nama_merch" | "nama_kategori" | "nama_stasiun" | "jumlah";
const PAGE_SIZE = 5;

export default function RiwayatTransaksiPage() {
  const [data, setData] = useState<RiwayatItem[]>([]);
  const [kategoriList, setKategoriList] = useState<{ id_kategori: number; nama_kategori: string }[]>([]);
  const [summary, setSummary] = useState({ totalTransaksiBulanIni: 0, totalBarangKeluar30Hari: 0, stasiunTerpopuler: null as { nama_stasiun: string; totalDistribusi: number } | null });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [sort, setSort] = useState("tanggal_keluar:desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, sort, kategoriFilter, tanggal]);

  useEffect(() => {
    fetch("/api/kategori")
      .then((res) => res.json())
      .then((data) => Array.isArray(data) && setKategoriList(data))
      .catch(console.error);
  }, []);

  const getData = useCallback(async () => {
    try {
      setLoading(true);
      const { sortBy, sortOrder } = parseSortValue<SortField>(sort, "tanggal_keluar", "desc");
      const params = new URLSearchParams({ page: String(currentPage), limit: String(PAGE_SIZE), search: debouncedSearch, sortBy, sortOrder });
      if (kategoriFilter) params.set("id_kategori", kategoriFilter);
      if (tanggal) params.set("tanggal", tanggal);

      const [dataRes, summaryRes] = await Promise.all([
        fetch(`/api/riwayat-transaksi?${params}`),
        fetch("/api/riwayat-transaksi/summary"),
      ]);

      if (dataRes.ok) {
        const result = await dataRes.json();
        setData(result.data);
        setTotalPages(result.totalPages);
        setTotal(result.total);
      }
      if (summaryRes.ok) setSummary(await summaryRes.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, sort, kategoriFilter, tanggal]);

  useEffect(() => {
    getData();
  }, [getData]);

  async function handleExport() {
    try {
      setExporting(true);
      const { sortBy, sortOrder } = parseSortValue<SortField>(sort, "tanggal_keluar", "desc");
      const params = new URLSearchParams({ page: "1", limit: "10000", search: debouncedSearch, sortBy, sortOrder });
      if (kategoriFilter) params.set("id_kategori", kategoriFilter);
      if (tanggal) params.set("tanggal", tanggal);

      const response = await fetch(`/api/riwayat-transaksi?${params}`);
      const result = await response.json();
      if (!response.ok) throw new Error();

      const csv = [
        ["ID", "Tanggal", "Nama Barang", "Kategori", "Stasiun", "Jumlah", "Keterangan"].join(","),
        ...result.data.map((item: RiwayatItem) =>
          [formatTransaksiId(item.id_keluar), formatTransaksiDate(item.tanggal_keluar), `"${item.merchandise.nama_merch}"`, `"${item.kategori.nama_kategori}"`, `"${item.stasiun.nama_stasiun}"`, item.jumlah, `"${item.keterangan ?? ""}"`].join(",")
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
      alert("Gagal mengekspor data");
    } finally {
      setExporting(false);
    }
  }

  const { sortBy, sortOrder } = parseSortValue<SortField>(sort, "tanggal_keluar", "desc");

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
            <PrimaryButton href="/barang-keluar/tambah">Tambah Transaksi</PrimaryButton>
          </>
        }
      />

      <RiwayatSummary {...summary} />

      <FilterBar
        onReset={() => {
          setSearch("");
          setKategoriFilter("");
          setTanggal("");
          setSort("tanggal_keluar:desc");
        }}
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
          onChange={setKategoriFilter}
          placeholder="Pilih kategori..."
          options={kategoriList.map((item) => ({ value: String(item.id_kategori), label: item.nama_kategori }))}
        />
        <FilterDateRange value={tanggal} onChange={setTanggal} label="Tanggal" />
        <FilterSelect
          id="sort-riwayat"
          label="Urutkan"
          value={sort}
          onChange={setSort}
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
              <SortableTh label="Tanggal & Waktu" field="tanggal_keluar" activeField={sortBy} activeOrder={sortOrder} onSort={(f) => setSort(toggleSortValue(sort, f))} />
              <SortableTh label="Nama Barang" field="nama_merch" activeField={sortBy} activeOrder={sortOrder} onSort={(f) => setSort(toggleSortValue(sort, f))} />
              <SortableTh label="Kategori" field="nama_kategori" activeField={sortBy} activeOrder={sortOrder} onSort={(f) => setSort(toggleSortValue(sort, f))} />
              <SortableTh label="Stasiun/Lokasi" field="nama_stasiun" activeField={sortBy} activeOrder={sortOrder} onSort={(f) => setSort(toggleSortValue(sort, f))} />
              <SortableTh label="Jumlah" field="jumlah" activeField={sortBy} activeOrder={sortOrder} onSort={(f) => setSort(toggleSortValue(sort, f))} />
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableEmptyRow colSpan={6} message="Memuat data..." />
            ) : data.length === 0 ? (
              <TableEmptyRow colSpan={6} message="Tidak ada transaksi ditemukan" />
            ) : (
              data.map((item) => (
                <tr key={item.id_keluar} className="border-b border-[#EFEAE5] hover:bg-gray-50/60">
          
                  <Td>{formatTransaksiDate(item.tanggal_keluar)}</Td>
                  <Td>{item.merchandise.nama_merch}</Td>
                  <Td>{item.kategori.nama_kategori}</Td>
                  <Td>{item.stasiun.nama_stasiun}</Td>
                  <Td>{item.jumlah.toLocaleString("id-ID")}</Td>
                  <Td className="max-w-xs truncate">{item.keterangan || "-"}</Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!loading && total > 0 && (
          <div className="border-t border-[#EFEAE5] px-5 py-4">
            <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={total} pageSize={PAGE_SIZE} itemLabel="transaksi" onPageChange={setCurrentPage} />
          </div>
        )}
      </DataTableSection>
    </div>
  );
}
