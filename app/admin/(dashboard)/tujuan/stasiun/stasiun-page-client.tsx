"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import StasiunForm from "@/components/stasiun/stasiun-form";
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
import { DeleteAction, TextOutlineAction } from "@/components/ui/table-actions";
import { useFormModal } from "@/hooks/use-form-modal";
import { useListFilters } from "@/hooks/use-list-filters";
import { parseSortValue, toggleSortValue } from "@/lib/sort";
import { showError, showSuccess } from "@/lib/toast";

import {
  createStasiunAction,
  deleteStasiunAction,
  getStasiunFormData,
  updateStasiunAction,
} from "./actions";

interface StasiunItem {
  id_stasiun: number;
  kode_stasiun: string;
  nama_stasiun: string;
}

type SortField = "kode_stasiun" | "nama_stasiun";

interface Props {
  list: {
    data: StasiunItem[];
    total: number;
    currentPage: number;
    totalPages: number;
  };
  pageSize: number;
  defaultSort: string;
}

export default function TujuanStasiunPageClient({
  list,
  pageSize,
  defaultSort,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    search,
    setSearch,
    page,
    sort,
    setParam,
    setPage,
    resetParams,
  } = useListFilters({ sort: defaultSort });

  const modal = useFormModal<{
    kode_stasiun: string;
    nama_stasiun: string;
    alamat: string;
    kontak: string;
  }>(getStasiunFormData);

  const [deleteId, setDeleteId] = useState<number | null>(null);

  const currentSort = sort || defaultSort;
  const { sortBy, sortOrder } = parseSortValue<SortField>(
    currentSort,
    "nama_stasiun"
  );

  async function handleSubmit(data: {
    kode_stasiun: string;
    nama_stasiun: string;
    alamat: string;
    kontak: string;
  }) {
    modal.setSaving(true);
    const result = modal.editId
      ? await updateStasiunAction(modal.editId, data)
      : await createStasiunAction(data);
    modal.setSaving(false);

    if (!result.ok) {
      showError(result.message);
      return;
    }

    showSuccess(
      modal.isEdit ? "Stasiun berhasil diperbarui" : "Stasiun berhasil ditambahkan"
    );
    modal.close();
    startTransition(() => router.refresh());
  }

  async function handleDelete() {
    if (!deleteId) return;
    const result = await deleteStasiunAction(deleteId);
    if (!result.ok) {
      showError(result.message);
      return;
    }
    setDeleteId(null);
    showSuccess("Stasiun berhasil dihapus");
    startTransition(() => router.refresh());
  }

  return (
    <>
      <div className="space-y-6">

        <PageHeader
          title="Daftar Stasiun"
          description="Sub daftar untuk kategori tujuan berjenis Stasiun."
          actions={
            <PrimaryButton onClick={() => modal.openAdd()}>
              + Tambah Stasiun
            </PrimaryButton>
          }
        />

        <FilterBar onReset={() => resetParams(["search", "sort"])}>
          <FilterSearch
            value={search}
            onChange={setSearch}
            placeholder="Cari stasiun berdasarkan nama atau kode..."
          />
          <FilterSelect
            id="sort-stasiun"
            label="Urutkan"
            value={currentSort}
            onChange={(value) => setParam("sort", value)}
            placeholder="Pilih urutan..."
            options={[
              { value: "nama_stasiun:asc", label: "Nama (A-Z)" },
              { value: "nama_stasiun:desc", label: "Nama (Z-A)" },
              { value: "kode_stasiun:asc", label: "Kode (A-Z)" },
            ]}
          />
        </FilterBar>

        <DataTableSection>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#EFEAE5] bg-[#FAFAFA]">
                <SortableTh
                  label="Kode Stasiun"
                  field="kode_stasiun"
                  activeField={sortBy}
                  activeOrder={sortOrder}
                  onSort={(f) =>
                    setParam("sort", toggleSortValue(currentSort, f))
                  }
                />
                <SortableTh
                  label="Nama Stasiun"
                  field="nama_stasiun"
                  activeField={sortBy}
                  activeOrder={sortOrder}
                  onSort={(f) =>
                    setParam("sort", toggleSortValue(currentSort, f))
                  }
                />
                <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {isPending ? (
                <TableEmptyRow colSpan={3} message="Memuat data..." />
              ) : list.data.length === 0 ? (
                <TableEmptyRow colSpan={3} message="Belum ada data stasiun" />
              ) : (
                list.data.map((item) => (
                  <tr
                    key={item.id_stasiun}
                    className="border-b border-[#EFEAE5] hover:bg-gray-50/60"
                  >
                    <Td>
                      <span className="font-medium">{item.kode_stasiun}</span>
                    </Td>
                    <Td>{item.nama_stasiun}</Td>
                    <Td align="center" variant="action">
                      <div className="flex items-center justify-center gap-3">
                        <TextOutlineAction
                          label="Edit"
                          onClick={() => modal.openEdit(item.id_stasiun)}
                        />
                        <DeleteAction
                          onClick={() => setDeleteId(item.id_stasiun)}
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
                itemLabel="stasiun"
                onPageChange={setPage}
              />
            </div>
          )}
        </DataTableSection>
      </div>

      <FormDialog
        open={modal.open}
        onOpenChange={modal.setOpen}
        title={modal.isEdit ? "Edit Stasiun" : "Tambah Stasiun"}
        description="Kelola stasiun sebagai detail tujuan distribusi."
        loading={modal.loading}
      >
        <StasiunForm
          key={modal.editId ?? "new"}
          initialData={modal.editData ?? undefined}
          onSubmit={handleSubmit}
          loading={modal.saving}
          onCancel={modal.close}
          cancelHref="/admin/tujuan/stasiun"
        />
      </FormDialog>

      <ConfirmDialog
        open={deleteId !== null}
        title="Hapus Stasiun"
        message="Apakah Anda yakin ingin menghapus stasiun ini?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
}
