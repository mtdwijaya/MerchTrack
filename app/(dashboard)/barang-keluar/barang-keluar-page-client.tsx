"use client";

import { useEffect, useState, useTransition } from "react";

import BarangKeluarForm from "@/components/barang-keluar/barang-keluar-form";
import BarangKeluarSummary from "@/components/barang-keluar/barang-keluar-summary";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import {
  DataTableSection,
  SortableTh,
  TableEmptyRow,
  Td,
} from "@/components/ui/data-table";
import FormDialog from "@/components/ui/form-dialog";
import {
  FilterBar,
  FilterSearch,
  FilterSelect,
} from "@/components/ui/filter-bar";
import PageHeader, { PrimaryButton } from "@/components/ui/page-header";
import Pagination from "@/components/ui/pagination";
import { DeleteAction, EditAction } from "@/components/ui/table-actions";
import { useFormModal } from "@/hooks/use-form-modal";
import { useListFilters } from "@/hooks/use-list-filters";
import { parseSortValue, toggleSortValue } from "@/lib/sort";
import { showError, showSuccess } from "@/lib/toast";

import {
  createBarangKeluarAction,
  deleteBarangKeluarAction,
  getBarangKeluarFormData,
  updateBarangKeluarAction,
} from "./actions";

type SortField =
  | "tanggal_keluar"
  | "nama_merch"
  | "nama_stasiun"
  | "nama_kategori"
  | "jumlah";

const SORT_OPTIONS = [
  { value: "tanggal_keluar:desc", label: "Tanggal (Terbaru)" },
  { value: "id_keluar:desc", label: "ID (Terbaru)" },
  { value: "nama_merch:asc", label: "Merchandise (A-Z)" },
  { value: "nama_stasiun:asc", label: "Stasiun (A-Z)" },
  { value: "jumlah:desc", label: "Jumlah (Terbesar)" },
];

interface MerchandiseOption {
  id_merch: number;
  nama_merch: string;
  jumlah_stok: number;
}

interface StasiunOption {
  id_stasiun: number;
  nama_stasiun: string;
}

interface KategoriOption {
  id_kategori: number;
  nama_kategori: string;
}

interface Props {
  list: {
    data: {
      id_keluar: number;
      jumlah: number;
      tanggal_keluar: string | Date;
      merchandise: { nama_merch: string };
      stasiun: { nama_stasiun: string };
      kategori: { nama_kategori: string };
      user: { nama_user: string };
    }[];
    total: number;
    totalPages: number;
  };
  summary: {
    totalTransaksi: number;
    totalBarangKeluar: number;
    totalStasiun: number;
  };
  merchandiseList: MerchandiseOption[];
  stasiunList: StasiunOption[];
  kategoriList: KategoriOption[];
  pageSize: number;
  defaultSort: string;
  openModal?: boolean;
}

export default function BarangKeluarPageClient({
  list,
  summary,
  merchandiseList,
  stasiunList,
  kategoriList,
  pageSize,
  defaultSort,
  openModal: openModalParam,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const {
    search,
    setSearch,
    page,
    sort,
    setParam,
    setPage,
    resetParams,
    getParam,
    replaceParams,
  } = useListFilters({ sort: defaultSort });

  const stasiunFilter = getParam("id_stasiun");
  const kategoriFilter = getParam("id_kategori");

  const modal = useFormModal<{
    id_merch: number;
    id_stasiun: number;
    id_kategori: number;
    jumlah: number;
    tanggal_keluar: string;
    keterangan: string;
  }>(getBarangKeluarFormData);

  const [deleteId, setDeleteId] = useState<number | null>(null);

  const currentSort = sort || defaultSort;
  const { sortBy, sortOrder } = parseSortValue<SortField>(
    currentSort,
    "tanggal_keluar",
    "desc"
  );

  function openAddModal() {
    modal.openAdd();
  }

  useEffect(() => {
    if (openModalParam) {
      modal.openAdd();
      replaceParams({ modal: null });
    }
  }, [openModalParam, replaceParams, modal.openAdd]);

  function openEditModal(id: number) {
    modal.openEdit(id);
  }

  async function handleSubmit(data: {
    id_merch: number;
    id_stasiun: number;
    id_kategori: number;
    jumlah: number;
    tanggal_keluar: string;
    keterangan: string;
  }) {
    modal.setSaving(true);
    const result = modal.editId
      ? await updateBarangKeluarAction(modal.editId, data)
      : await createBarangKeluarAction(data);
    modal.setSaving(false);

    if (!result.ok) {
      showError(result.message);
      return;
    }

    showSuccess(
      modal.isEdit
        ? "Data berhasil diperbarui"
        : "Barang keluar berhasil ditambahkan"
    );
    modal.close();
    startTransition(() => {});
  }

  async function handleDelete() {
    if (!deleteId) return;
    const result = await deleteBarangKeluarAction(deleteId);
    if (!result.ok) {
      showError(result.message);
      return;
    }
    setDeleteId(null);
    showSuccess("Data berhasil dihapus");
    startTransition(() => {});
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Manajemen Barang Keluar"
          description="Kelola seluruh transaksi barang keluar."
          actions={
            <PrimaryButton onClick={openAddModal}>
              + Catat Barang Keluar
            </PrimaryButton>
          }
        />

        <BarangKeluarSummary {...summary} />

        <FilterBar
          onReset={() =>
            resetParams(["search", "sort", "id_stasiun", "id_kategori"])
          }
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
            onChange={(value) => setParam("id_stasiun", value)}
            placeholder="Pilih stasiun..."
            options={stasiunList.map((item) => ({
              value: String(item.id_stasiun),
              label: item.nama_stasiun,
            }))}
          />
          <FilterSelect
            id="filter-kategori-bk"
            label="Kategori"
            value={kategoriFilter}
            onChange={(value) => setParam("id_kategori", value)}
            placeholder="Pilih kategori..."
            options={kategoriList.map((item) => ({
              value: String(item.id_kategori),
              label: item.nama_kategori,
            }))}
          />
          <FilterSelect
            id="sort-bk"
            label="Urutkan"
            value={currentSort}
            onChange={(value) => setParam("sort", value)}
            placeholder="Pilih urutan..."
            options={SORT_OPTIONS}
          />
        </FilterBar>

        <DataTableSection>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#EFEAE5] bg-[#FAFAFA]">
                <SortableTh
                  label="Tanggal"
                  field="tanggal_keluar"
                  activeField={sortBy}
                  activeOrder={sortOrder}
                  onSort={(f) =>
                    setParam("sort", toggleSortValue(currentSort, f))
                  }
                />
                <SortableTh
                  label="Merchandise"
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
                  label="Stasiun"
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
                  Petugas
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {isPending ? (
                <TableEmptyRow colSpan={7} message="Memuat data..." />
              ) : list.data.length === 0 ? (
                <TableEmptyRow colSpan={7} message="Tidak ada data" />
              ) : (
                list.data.map((item) => (
                  <tr
                    key={item.id_keluar}
                    className="border-b border-[#EFEAE5] hover:bg-gray-50/60"
                  >
                    <Td>
                      {new Date(item.tanggal_keluar).toLocaleDateString(
                        "id-ID"
                      )}
                    </Td>
                    <Td>{item.merchandise.nama_merch}</Td>
                    <Td>{item.kategori.nama_kategori}</Td>
                    <Td>{item.stasiun.nama_stasiun}</Td>
                    <Td>{item.jumlah}</Td>
                    <Td>{item.user.nama_user}</Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <EditAction
                          onClick={() => openEditModal(item.id_keluar)}
                        />
                        <DeleteAction
                          onClick={() => setDeleteId(item.id_keluar)}
                        />
                      </div>
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

      <FormDialog
        open={modal.open}
        onOpenChange={modal.setOpen}
        title={modal.isEdit ? "Edit Barang Keluar" : "Tambah Barang Keluar"}
        description={
          modal.isEdit
            ? "Perbarui data transaksi barang keluar."
            : "Catat transaksi barang keluar baru."
        }
        loading={modal.loading}
        contentClassName="sm:max-w-2xl"
      >
        <BarangKeluarForm
          key={modal.editId ?? "new"}
          initialData={modal.editData ?? undefined}
          onSubmit={handleSubmit}
          loading={modal.saving}
          onCancel={modal.close}
          merchandiseList={merchandiseList}
          stasiunList={stasiunList}
          kategoriList={kategoriList}
        />
      </FormDialog>

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
