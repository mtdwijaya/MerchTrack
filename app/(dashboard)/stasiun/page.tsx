"use client";

import { useCallback, useEffect, useState } from "react";

import ConfirmDialog from "@/components/ui/confirm-dialog";
import {
  DataTableSection,
  SortableTh,
  TableEmptyRow,
  Td,
} from "@/components/ui/data-table";
import {
  FilterBar,
  FilterSearch,
  FilterSelect,
} from "@/components/ui/filter-bar";
import PageHeader, { PrimaryButton } from "@/components/ui/page-header";
import Pagination from "@/components/ui/pagination";
import SummaryCards from "@/components/ui/summary-cards";
import { DeleteAction, EditAction } from "@/components/ui/table-actions";
import { useDebounce } from "@/hooks/use-debounce";
import { parseSortValue, toggleSortValue } from "@/lib/sort";

interface Stasiun {
  id_stasiun: number;
  kode_stasiun: string;
  nama_stasiun: string;
}

type SortField = "id_stasiun" | "kode_stasiun" | "nama_stasiun";
const PAGE_SIZE = 5;
const DEFAULT_SORT = "nama_stasiun:asc";

export default function StasiunPage() {
  const [data, setData] = useState<Stasiun[]>([]);
  const [summary, setSummary] = useState({ totalStasiun: 0, stasiunAktif: 0, totalPetugas: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, sort]);

  const getData = useCallback(async () => {
    try {
      setLoading(true);
      const { sortBy, sortOrder } = parseSortValue<SortField>(sort, "nama_stasiun");

      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(PAGE_SIZE),
        search: debouncedSearch,
        sortBy,
        sortOrder,
      });

      const [dataRes, summaryRes] = await Promise.all([
        fetch(`/api/stasiun?${params}`),
        fetch("/api/stasiun/summary"),
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
  }, [currentPage, debouncedSearch, sort]);

  useEffect(() => {
    getData();
  }, [getData]);

  async function handleDelete() {
    if (!deleteId) return;
    try {
      const response = await fetch(`/api/stasiun/${deleteId}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      setDeleteId(null);
      await getData();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Gagal menghapus stasiun");
    }
  }

  const { sortBy, sortOrder } = parseSortValue<SortField>(sort, "nama_stasiun");

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Manajemen Stasiun"
          description="Kelola data stasiun penerima distribusi merchandise."
          actions={<PrimaryButton href="/stasiun/tambah">+ Tambah Stasiun Baru</PrimaryButton>}
        />

        <SummaryCards
          items={[
            { title: "Total Stasiun", value: summary.totalStasiun, iconSrc: "/icons/icon-red-stasiun.svg", subtitle: "Seluruh stasiun terdaftar" },
            { title: "Stasiun Aktif", value: summary.stasiunAktif, iconSrc: "/icons/icon-barangkeluar-merah.svg", subtitle: "Stasiun dengan transaksi" },
            { title: "Petugas Terdaftar", value: summary.totalPetugas, iconSrc: "/icons/icon-kelolapengguna-merah.svg", subtitle: "Petugas dengan stasiun" },
          ]}
        />

        <FilterBar>
          <FilterSearch value={search} onChange={setSearch} placeholder="Cari stasiun berdasarkan nama atau kode..." className="lg:col-span-8" />
          <FilterSelect
            id="sort-stasiun"
            className="lg:col-span-4"
            value={sort}
            onChange={setSort}
            options={[
              { value: "nama_stasiun:asc", label: "Nama (A-Z)" },
              { value: "nama_stasiun:desc", label: "Nama (Z-A)" },
              { value: "kode_stasiun:asc", label: "Kode (A-Z)" },
              { value: "id_stasiun:desc", label: "ID (Terbaru)" },
            ]}
          />
        </FilterBar>

        <DataTableSection>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#EFEAE5] bg-[#FAFAFA]">
                <SortableTh label="Kode Stasiun" field="kode_stasiun" activeField={sortBy} activeOrder={sortOrder} onSort={(f) => setSort(toggleSortValue(sort, f))} />
                <SortableTh label="Nama Stasiun" field="nama_stasiun" activeField={sortBy} activeOrder={sortOrder} onSort={(f) => setSort(toggleSortValue(sort, f))} />
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableEmptyRow colSpan={3} message="Memuat data..." />
              ) : data.length === 0 ? (
                <TableEmptyRow colSpan={3} message="Belum ada data stasiun" />
              ) : (
                data.map((item) => (
                  <tr key={item.id_stasiun} className="border-b border-[#EFEAE5] hover:bg-gray-50/60">
                    <Td><span className="font-medium">{item.kode_stasiun}</span></Td>
                    <Td>{item.nama_stasiun}</Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <EditAction href={`/stasiun/${item.id_stasiun}/edit`} />
                        <DeleteAction onClick={() => setDeleteId(item.id_stasiun)} />
                      </div>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {!loading && total > 0 && (
            <div className="border-t border-[#EFEAE5] px-5 py-4">
              <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={total} pageSize={PAGE_SIZE} itemLabel="stasiun" onPageChange={setCurrentPage} />
            </div>
          )}
        </DataTableSection>
      </div>

      <ConfirmDialog open={deleteId !== null} title="Hapus Stasiun" message="Apakah Anda yakin ingin menghapus stasiun ini?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </>
  );
}
