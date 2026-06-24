"use client";

import { useCallback, useEffect, useState } from "react";

import BarangKeluarSummary from "@/components/barang-keluar/barang-keluar-summary";
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
import { DeleteAction, EditAction } from "@/components/ui/table-actions";
import { useDebounce } from "@/hooks/use-debounce";
import { parseSortValue, toggleSortValue } from "@/lib/sort";
import { showError, showSuccess } from "@/lib/toast";

interface BarangKeluar {
  id_keluar: number;
  jumlah: number;
  tanggal_keluar: string;
  merchandise: { nama_merch: string };
  stasiun: { nama_stasiun: string };
  kategori: { nama_kategori: string };
  user: { nama_user: string };
}

interface Option {
  id_stasiun?: number;
  id_kategori?: number;
  nama_stasiun?: string;
  nama_kategori?: string;
}

type SortField =
  | "id_keluar"
  | "tanggal_keluar"
  | "nama_merch"
  | "nama_stasiun"
  | "nama_kategori"
  | "jumlah";

const PAGE_SIZE = 10;
const DEFAULT_SORT = "tanggal_keluar:desc";

const SORT_OPTIONS = [
  { value: "tanggal_keluar:desc", label: "Tanggal (Terbaru)" },
  { value: "id_keluar:desc", label: "ID (Terbaru)" },
  { value: "nama_merch:asc", label: "Merchandise (A-Z)" },
  { value: "nama_stasiun:asc", label: "Stasiun (A-Z)" },
  { value: "jumlah:desc", label: "Jumlah (Terbesar)" },
];

export default function BarangKeluarPage() {
  const [data, setData] = useState<BarangKeluar[]>([]);
  const [stasiunList, setStasiunList] = useState<Option[]>([]);
  const [kategoriList, setKategoriList] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stasiunFilter, setStasiunFilter] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState("");
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({
    totalTransaksi: 0,
    totalBarangKeluar: 0,
    totalStasiun: 0,
  });

  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, sort, stasiunFilter, kategoriFilter]);

  useEffect(() => {
    Promise.all([fetch("/api/stasiun"), fetch("/api/kategori")])
      .then(async ([stasiunRes, kategoriRes]) => {
        if (stasiunRes.ok) setStasiunList(await stasiunRes.json());
        if (kategoriRes.ok) setKategoriList(await kategoriRes.json());
      })
      .catch(console.error);
  }, []);

  const getData = useCallback(async () => {
    try {
      setLoading(true);
      const { sortBy, sortOrder } = parseSortValue<SortField>(sort, "tanggal_keluar", "desc");

      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(PAGE_SIZE),
        search: debouncedSearch,
        sortBy,
        sortOrder,
      });

      if (stasiunFilter) params.set("id_stasiun", stasiunFilter);
      if (kategoriFilter) params.set("id_kategori", kategoriFilter);

      const [dataRes, summaryRes] = await Promise.all([
        fetch(`/api/barang-keluar?${params}`),
        fetch("/api/barang-keluar/summary"),
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
  }, [currentPage, debouncedSearch, sort, stasiunFilter, kategoriFilter]);

  useEffect(() => {
    getData();
  }, [getData]);

  async function handleDelete() {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/barang-keluar/${deleteId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error();

      setDeleteId(null);
      showSuccess("Data berhasil dihapus");
      await getData();
    } catch {
      showError("Gagal menghapus data");
    }
  }

  const { sortBy, sortOrder } = parseSortValue<SortField>(
    sort,
    "tanggal_keluar",
    "desc"
  );

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Manajemen Barang Keluar"
          description="Kelola seluruh transaksi barang keluar."
          actions={
            <PrimaryButton href="/barang-keluar/tambah">
              + Catat Barang Keluar
            </PrimaryButton>
          }
        />

        <BarangKeluarSummary {...summary} />

        <FilterBar
          onReset={() => {
            setSearch("");
            setStasiunFilter("");
            setKategoriFilter("");
            setSort(DEFAULT_SORT);
          }}
        >
          <FilterSearch
            value={search}
            onChange={setSearch}
            placeholder="Cari merchandise, stasiun, atau kategori..."
          />
          <FilterSelect
            id="filter-stasiun-bk"
            label="Stasiun"
            value={stasiunFilter}
            onChange={setStasiunFilter}
            placeholder="Pilih stasiun..."
            options={stasiunList.map((item) => ({
              value: String(item.id_stasiun),
              label: item.nama_stasiun ?? "",
            }))}
          />
          <FilterSelect
            id="filter-kategori-bk"
            label="Kategori"
            value={kategoriFilter}
            onChange={setKategoriFilter}
            placeholder="Pilih kategori..."
            options={kategoriList.map((item) => ({
              value: String(item.id_kategori),
              label: item.nama_kategori ?? "",
            }))}
          />
          <FilterSelect
            id="sort-bk"
            label="Urutkan"
            value={sort}
            onChange={setSort}
            placeholder="Pilih urutan..."
            options={SORT_OPTIONS}
          />
        </FilterBar>

        <DataTableSection>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#EFEAE5] bg-[#FAFAFA]">
                <SortableTh label="Tanggal" field="tanggal_keluar" activeField={sortBy} activeOrder={sortOrder} onSort={(f) => setSort(toggleSortValue(sort, f))} />
                <SortableTh label="Merchandise" field="nama_merch" activeField={sortBy} activeOrder={sortOrder} onSort={(f) => setSort(toggleSortValue(sort, f))} />
                <SortableTh label="Kategori" field="nama_kategori" activeField={sortBy} activeOrder={sortOrder} onSort={(f) => setSort(toggleSortValue(sort, f))} />
                <SortableTh label="Stasiun" field="nama_stasiun" activeField={sortBy} activeOrder={sortOrder} onSort={(f) => setSort(toggleSortValue(sort, f))} />
                <SortableTh label="Jumlah" field="jumlah" activeField={sortBy} activeOrder={sortOrder} onSort={(f) => setSort(toggleSortValue(sort, f))} />
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Petugas</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableEmptyRow colSpan={7} message="Memuat data..." />
              ) : data.length === 0 ? (
                <TableEmptyRow colSpan={7} message="Tidak ada data" />
              ) : (
                data.map((item) => (
                  <tr key={item.id_keluar} className="border-b border-[#EFEAE5] hover:bg-gray-50/60">
                    <Td>{new Date(item.tanggal_keluar).toLocaleDateString("id-ID")}</Td>
                    <Td>{item.merchandise.nama_merch}</Td>
                    <Td>{item.kategori.nama_kategori}</Td>
                    <Td>{item.stasiun.nama_stasiun}</Td>
                    <Td>{item.jumlah}</Td>
                    <Td>{item.user.nama_user}</Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <EditAction href={`/barang-keluar/${item.id_keluar}/edit`} />
                        <DeleteAction onClick={() => setDeleteId(item.id_keluar)} />
                      </div>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {!loading && total > 0 && (
            <div className="border-t border-[#EFEAE5] px-5 py-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={total}
                pageSize={PAGE_SIZE}
                itemLabel="transaksi"
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </DataTableSection>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title="Hapus Data"
        message="Apakah Anda yakin ingin menghapus transaksi ini?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
}
