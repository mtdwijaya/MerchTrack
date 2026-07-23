"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useState, useTransition } from "react";

import UnitForm from "@/components/unit/unit-form";
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
  createUnitAction,
  deleteUnitAction,
  getUnitFormData,
  updateUnitAction,
} from "./actions";

interface UnitItem {
  id_unit: number;
  kode_unit: string;
  nama_unit: string;
}

type SortField = "kode_unit" | "nama_unit";

interface Props {
  list: {
    data: UnitItem[];
    total: number;
    currentPage: number;
    totalPages: number;
  };
  pageSize: number;
  defaultSort: string;
}

export default function TujuanUnitPageClient({
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
    kode_unit: string;
    nama_unit: string;
  }>(getUnitFormData);

  const [deleteId, setDeleteId] = useState<number | null>(null);

  const currentSort = sort || defaultSort;
  const { sortBy, sortOrder } = parseSortValue<SortField>(
    currentSort,
    "nama_unit"
  );

  async function handleSubmit(data: {
    kode_unit: string;
    nama_unit: string;
  }) {
    modal.setSaving(true);
    const result = modal.editId
      ? await updateUnitAction(modal.editId, data)
      : await createUnitAction(data);
    modal.setSaving(false);

    if (!result.ok) {
      showError(result.message);
      return;
    }

    showSuccess(
      modal.isEdit ? "Unit berhasil diperbarui" : "Unit berhasil ditambahkan"
    );
    modal.close();
    startTransition(() => router.refresh());
  }

  async function handleDelete() {
    if (!deleteId) return;
    const result = await deleteUnitAction(deleteId);
    if (!result.ok) {
      showError(result.message);
      return;
    }
    setDeleteId(null);
    showSuccess("Unit berhasil dihapus");
    startTransition(() => router.refresh());
  }

  return (
    <>
      <div className="space-y-6">


        <PageHeader
          title="Daftar Unit"
          description="Sub daftar untuk kategori tujuan berjenis Unit."
          actions={
            <PrimaryButton onClick={() => modal.openAdd()}>
              + Tambah Unit
            </PrimaryButton>
          }
        />

        <FilterBar onReset={() => resetParams(["search", "sort"])}>
          <FilterSearch
            value={search}
            onChange={setSearch}
            placeholder="Cari unit berdasarkan nama atau kode..."
          />
          <FilterSelect
            id="sort-unit"
            label="Urutkan"
            value={currentSort}
            onChange={(value) => setParam("sort", value)}
            placeholder="Pilih urutan..."
            options={[
              { value: "nama_unit:asc", label: "Nama (A-Z)" },
              { value: "nama_unit:desc", label: "Nama (Z-A)" },
              { value: "kode_unit:asc", label: "Kode (A-Z)" },
            ]}
          />
        </FilterBar>

        <DataTableSection>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#EFEAE5] bg-[#FAFAFA]">
                <SortableTh
                  label="Kode Unit"
                  field="kode_unit"
                  activeField={sortBy}
                  activeOrder={sortOrder}
                  onSort={(f) =>
                    setParam("sort", toggleSortValue(currentSort, f))
                  }
                />
                <SortableTh
                  label="Nama Unit"
                  field="nama_unit"
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
                <TableEmptyRow colSpan={3} message="Belum ada data unit" />
              ) : (
                list.data.map((item) => (
                  <tr
                    key={item.id_unit}
                    className="border-b border-[#EFEAE5] hover:bg-gray-50/60"
                  >
                    <Td>
                      <span className="font-medium">{item.kode_unit}</span>
                    </Td>
                    <Td>{item.nama_unit}</Td>
                    <Td align="center" variant="action">
                      <div className="flex items-center justify-center gap-3">
                        <TextOutlineAction
                          label="Edit"
                          onClick={() => modal.openEdit(item.id_unit)}
                        />
                        <DeleteAction
                          onClick={() => setDeleteId(item.id_unit)}
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
                itemLabel="unit"
                onPageChange={setPage}
              />
            </div>
          )}
        </DataTableSection>
      </div>

      <FormDialog
        open={modal.open}
        onOpenChange={modal.setOpen}
        title={modal.isEdit ? "Edit Unit" : "Tambah Unit"}
        description="Kelola unit sebagai detail tujuan distribusi."
        loading={modal.loading}
      >
        <UnitForm
          key={modal.editId ?? "new"}
          initialData={modal.editData ?? undefined}
          onSubmit={handleSubmit}
          loading={modal.saving}
          onCancel={modal.close}
        />
      </FormDialog>

      <ConfirmDialog
        open={deleteId !== null}
        title="Hapus Unit"
        message="Apakah Anda yakin ingin menghapus unit ini?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
}
