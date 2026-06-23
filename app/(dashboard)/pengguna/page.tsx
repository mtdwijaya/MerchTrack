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

interface PenggunaItem {
  id_user: number;
  nama_user: string;
  email: string;
  role: "ADMIN" | "PETUGAS";
  stasiun: { nama_stasiun: string } | null;
}

type SortField = "id_user" | "nama_user" | "email" | "role";
const PAGE_SIZE = 5;

export default function PenggunaPage() {
  const [data, setData] = useState<PenggunaItem[]>([]);
  const [summary, setSummary] = useState({ totalPengguna: 0, totalAdmin: 0, totalPetugas: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [sort, setSort] = useState("nama_user:asc");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, sort, roleFilter]);

  const getData = useCallback(async () => {
    try {
      setLoading(true);
      const { sortBy, sortOrder } = parseSortValue<SortField>(sort, "nama_user");
      const params = new URLSearchParams({ page: String(currentPage), limit: String(PAGE_SIZE), search: debouncedSearch, sortBy, sortOrder });
      if (roleFilter) params.set("role", roleFilter);

      const [dataRes, summaryRes] = await Promise.all([
        fetch(`/api/pengguna?${params}`),
        fetch("/api/pengguna/summary"),
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
  }, [currentPage, debouncedSearch, sort, roleFilter]);

  useEffect(() => {
    getData();
  }, [getData]);

  async function handleDelete() {
    if (!deleteId) return;
    try {
      const response = await fetch(`/api/pengguna/${deleteId}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      setDeleteId(null);
      await getData();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Gagal menghapus pengguna");
    }
  }

  const { sortBy, sortOrder } = parseSortValue<SortField>(sort, "nama_user");

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Manajemen Pengguna"
          description="Kelola akun admin dan petugas sistem MerchTrack."
          actions={<PrimaryButton href="/pengguna/tambah">+ Tambah Pengguna</PrimaryButton>}
        />

        <SummaryCards
          items={[
            { title: "Total Pengguna", value: summary.totalPengguna, iconSrc: "/icons/icon-kelolapengguna-merah.svg", subtitle: "Seluruh akun terdaftar" },
            { title: "Admin", value: summary.totalAdmin, iconSrc: "/icons/icon-kelolapengguna-merah.svg", subtitle: "Pengguna dengan akses penuh" },
            { title: "Petugas", value: summary.totalPetugas, iconSrc: "/icons/icon-red-stasiun.svg", subtitle: "Pengguna operasional" },
          ]}
        />

        <FilterBar
          onReset={() => {
            setSearch("");
            setRoleFilter("");
            setSort("nama_user:asc");
          }}
        >
          <FilterSearch
            value={search}
            onChange={setSearch}
            placeholder="Cari nama atau email pengguna..."
          />
          <FilterSelect
            id="filter-role"
            label="Role"
            value={roleFilter}
            onChange={setRoleFilter}
            placeholder="Semua Role"
            options={[
              { value: "ADMIN", label: "Admin" },
              { value: "PETUGAS", label: "Petugas" },
            ]}
          />
          <FilterSelect
            id="sort-pengguna"
            label="Urutkan"
            value={sort}
            onChange={setSort}
            placeholder="Pilih urutan..."
            options={[
              { value: "nama_user:asc", label: "Nama (A-Z)" },
              { value: "email:asc", label: "Email (A-Z)" },
              { value: "role:asc", label: "Role (A-Z)" },
            ]}
          />
        </FilterBar>

        <DataTableSection>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#EFEAE5] bg-[#FAFAFA]">
                <SortableTh label="Nama" field="nama_user" activeField={sortBy} activeOrder={sortOrder} onSort={(f) => setSort(toggleSortValue(sort, f))} />
                <SortableTh label="Email" field="email" activeField={sortBy} activeOrder={sortOrder} onSort={(f) => setSort(toggleSortValue(sort, f))} />
                <SortableTh label="Role" field="role" activeField={sortBy} activeOrder={sortOrder} onSort={(f) => setSort(toggleSortValue(sort, f))} />
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Stasiun</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableEmptyRow colSpan={5} message="Memuat data..." />
              ) : data.length === 0 ? (
                <TableEmptyRow colSpan={5} message="Belum ada pengguna" />
              ) : (
                data.map((item) => (
                  <tr key={item.id_user} className="border-b border-[#EFEAE5] hover:bg-gray-50/60">
                    <Td>{item.nama_user}</Td>
                    <Td>{item.email}</Td>
                    <Td>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.role === "ADMIN" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}>
                        {item.role}
                      </span>
                    </Td>
                    <Td>{item.stasiun?.nama_stasiun ?? "-"}</Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <EditAction href={`/pengguna/${item.id_user}/edit`} />
                        <DeleteAction onClick={() => setDeleteId(item.id_user)} />
                      </div>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {!loading && total > 0 && (
            <div className="border-t border-[#EFEAE5] px-5 py-4">
              <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={total} pageSize={PAGE_SIZE} itemLabel="pengguna" onPageChange={setCurrentPage} />
            </div>
          )}
        </DataTableSection>
      </div>

      <ConfirmDialog open={deleteId !== null} title="Hapus Pengguna" message="Apakah Anda yakin ingin menghapus pengguna ini?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </>
  );
}
