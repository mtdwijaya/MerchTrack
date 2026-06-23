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

interface MerchandiseItem {
  id_merch: number;
  nama_merch: string;
  deskripsi: string | null;
  stok: { jumlah_stok: number } | null;
}

type SortField = "id_merch" | "nama_merch" | "jumlah_stok";
const PAGE_SIZE = 5;

export default function MerchandisePage() {
  const [data, setData] = useState<MerchandiseItem[]>([]);
  const [summary, setSummary] = useState({ totalMerchandise: 0, totalStok: 0, lowStockCount: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("nama_merch:asc");
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
      const { sortBy, sortOrder } = parseSortValue<SortField>(sort, "nama_merch");
      const params = new URLSearchParams({ page: String(currentPage), limit: String(PAGE_SIZE), search: debouncedSearch, sortBy, sortOrder });

      const [dataRes, summaryRes] = await Promise.all([
        fetch(`/api/merchandise?${params}`),
        fetch("/api/merchandise/summary"),
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
      const response = await fetch(`/api/merchandise/${deleteId}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      setDeleteId(null);
      await getData();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Gagal menghapus merchandise");
    }
  }

  const { sortBy, sortOrder } = parseSortValue<SortField>(sort, "nama_merch");

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Manajemen Merchandise"
          description="Kelola data merchandise dan stok gudang pusat."
          actions={<PrimaryButton href="/merchandise/tambah">+ Tambah Merchandise</PrimaryButton>}
        />

        <SummaryCards
          items={[
            { title: "Total Merchandise", value: summary.totalMerchandise, iconSrc: "/icons/icon-merchandise-merah.svg", subtitle: "Item terdaftar" },
            { title: "Total Stok", value: summary.totalStok, suffix: "Pcs", iconSrc: "/icons/icon-stok.svg", subtitle: "Akumulasi stok gudang" },
            { title: "Stok Rendah", value: summary.lowStockCount, iconSrc: "/icons/icon-barangkeluar-merah.svg", subtitle: "Perlu perhatian" },
          ]}
        />

        <FilterBar
          onReset={() => {
            setSearch("");
            setSort("nama_merch:asc");
          }}
        >
          <FilterSearch
            value={search}
            onChange={setSearch}
            placeholder="Cari nama atau deskripsi merchandise..."
          />
          <FilterSelect
            id="sort-merchandise"
            label="Urutkan"
            value={sort}
            onChange={setSort}
            placeholder="Pilih urutan..."
            options={[
              { value: "nama_merch:asc", label: "Nama (A-Z)" },
              { value: "jumlah_stok:desc", label: "Stok (Tertinggi)" },
              { value: "jumlah_stok:asc", label: "Stok (Terendah)" },
            ]}
          />
        </FilterBar>

        <DataTableSection>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#EFEAE5] bg-[#FAFAFA]">
                <SortableTh label="Nama Merchandise" field="nama_merch" activeField={sortBy} activeOrder={sortOrder} onSort={(f) => setSort(toggleSortValue(sort, f))} />
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Deskripsi</th>
                <SortableTh label="Stok" field="jumlah_stok" activeField={sortBy} activeOrder={sortOrder} onSort={(f) => setSort(toggleSortValue(sort, f))} />
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableEmptyRow colSpan={4} message="Memuat data..." />
              ) : data.length === 0 ? (
                <TableEmptyRow colSpan={4} message="Belum ada merchandise" />
              ) : (
                data.map((item) => (
                  <tr key={item.id_merch} className="border-b border-[#EFEAE5] hover:bg-gray-50/60">
                    <Td><span className="font-medium">{item.nama_merch}</span></Td>
                    <Td className="max-w-xs truncate">{item.deskripsi || "-"}</Td>
                    <Td>{item.stok?.jumlah_stok.toLocaleString("id-ID") ?? 0}</Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <EditAction href={`/merchandise/${item.id_merch}/edit`} />
                        <DeleteAction onClick={() => setDeleteId(item.id_merch)} />
                      </div>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {!loading && total > 0 && (
            <div className="border-t border-[#EFEAE5] px-5 py-4">
              <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={total} pageSize={PAGE_SIZE} itemLabel="merchandise" onPageChange={setCurrentPage} />
            </div>
          )}
        </DataTableSection>
      </div>

      <ConfirmDialog open={deleteId !== null} title="Hapus Merchandise" message="Apakah Anda yakin ingin menghapus merchandise ini?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </>
  );
}
