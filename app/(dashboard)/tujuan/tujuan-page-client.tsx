"use client";

import type { JenisDetailTujuan } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import TujuanForm, {
  type TujuanFormValues,
} from "@/components/tujuan/tujuan-form";
import { Badge } from "@/components/ui/badge";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import {
  DataTableSection,
  SortableTh,
  TableEmptyRow,
  Td,
  Th,
} from "@/components/ui/data-table";
import FormDialog from "@/components/ui/form-dialog";
import {
  FilterBar,
  FilterSearch,
  FilterSelect,
} from "@/components/ui/filter-bar";
import PageHeader, { PrimaryButton } from "@/components/ui/page-header";
import Pagination from "@/components/ui/pagination";
import SummaryCards from "@/components/ui/summary-cards";
import { DeleteAction, TextOutlineAction } from "@/components/ui/table-actions";
import { useFormModal } from "@/hooks/use-form-modal";
import { useListFilters } from "@/hooks/use-list-filters";
import { parseSortValue, toggleSortValue } from "@/lib/sort";
import { showError, showSuccess } from "@/lib/toast";
import {
  JENIS_DETAIL_LABEL,
} from "@/lib/tujuan-shared";

import {
  createTujuanAction,
  deleteTujuanAction,
  getTujuanFormData,
  updateTujuanAction,
} from "./actions";

interface TujuanItem {
  id_tujuan: number;
  nama_tujuan: string;
  jenis_detail: JenisDetailTujuan;
  label_detail: string | null;
  boleh_return: boolean;
  _count: { barangKeluar: number };
}

type SortField = "nama_tujuan" | "jenis_detail";

interface Props {
  list: {
    data: TujuanItem[];
    total: number;
    currentPage: number;
    totalPages: number;
  };
  summary: {
    totalTujuan: number;
    denganSubList: number;
    bolehReturn: number;
  };
  pageSize: number;
  defaultSort: string;
}

export default function TujuanPageClient({
  list,
  summary,
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
    getParam,
  } = useListFilters({ sort: defaultSort });

  const jenisFilter = getParam("jenis_detail");
  const modal = useFormModal<TujuanFormValues>(getTujuanFormData);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const currentSort = sort || defaultSort;
  const { sortBy, sortOrder } = parseSortValue<SortField>(
    currentSort,
    "nama_tujuan"
  );

  async function handleSubmit(data: TujuanFormValues) {
    modal.setSaving(true);
    const result = modal.editId
      ? await updateTujuanAction(modal.editId, data)
      : await createTujuanAction(data);
    modal.setSaving(false);

    if (!result.ok) {
      showError(result.message);
      return;
    }

    showSuccess(
      modal.isEdit ? "Tujuan berhasil diperbarui" : "Tujuan berhasil ditambahkan"
    );
    modal.close();
    startTransition(() => router.refresh());
  }

  async function handleDelete() {
    if (!deleteId) return;
    const result = await deleteTujuanAction(deleteId);
    if (!result.ok) {
      showError(result.message);
      return;
    }
    setDeleteId(null);
    showSuccess("Tujuan berhasil dihapus");
    startTransition(() => router.refresh());
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Manajemen Tujuan"
          description="Kelola kategori tujuan distribusi. Tujuan baru memakai detail free text; Stasiun/Unit dikelola lewat tombol Kelola."
          actions={
            <PrimaryButton onClick={() => modal.openAdd()}>
              + Tambah Tujuan
            </PrimaryButton>
          }
        />

        <SummaryCards
          items={[
            {
              title: "Total Tujuan",
              value: summary.totalTujuan,
              iconSrc: "/icons/icon-red-stasiun.svg",
              subtitle: "Kategori tujuan terdaftar",
            },
            {
              title: "Punya Sub Daftar",
              value: summary.denganSubList,
              iconSrc: "/icons/icon-barangkeluar-merah.svg",
              subtitle: "Jenis Stasiun / Unit",
            },
            {
              title: "Boleh Return",
              value: summary.bolehReturn,
              iconSrc: "/icons/icon-stok.svg",
              subtitle: "Kategori yang boleh dikembalikan",
            },
          ]}
        />

        <FilterBar
          onReset={() => resetParams(["search", "sort", "jenis_detail"])}
        >
          <FilterSearch
            value={search}
            onChange={setSearch}
            placeholder="Cari nama tujuan..."
          />
          <FilterSelect
            id="filter-jenis-tujuan"
            label="Jenis Detail"
            value={jenisFilter}
            onChange={(value) => setParam("jenis_detail", value)}
            placeholder="Semua jenis"
            options={[
              { value: "STASIUN", label: "Stasiun" },
              { value: "UNIT", label: "Unit" },
              { value: "TEKS", label: "Custom Text" },
              { value: "TIDAK_ADA", label: "Tanpa detail" },
            ]}
          />
          <FilterSelect
            id="sort-tujuan"
            label="Urutkan"
            value={currentSort}
            onChange={(value) => setParam("sort", value)}
            placeholder="Pilih urutan..."
            options={[
              { value: "nama_tujuan:asc", label: "Nama (A-Z)" },
              { value: "nama_tujuan:desc", label: "Nama (Z-A)" },
              { value: "jenis_detail:asc", label: "Jenis (A-Z)" },
            ]}
          />
        </FilterBar>

        <DataTableSection>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#EFEAE5] bg-[#FAFAFA]">
                <SortableTh
                  label="Nama Tujuan"
                  field="nama_tujuan"
                  activeField={sortBy}
                  activeOrder={sortOrder}
                  onSort={(f) =>
                    setParam("sort", toggleSortValue(currentSort, f))
                  }
                />
                <SortableTh
                  align="center"
                  label="Jenis Detail"
                  field="jenis_detail"
                  activeField={sortBy}
                  activeOrder={sortOrder}
                  onSort={(f) =>
                    setParam("sort", toggleSortValue(currentSort, f))
                  }
                />
                <Th align="center">Label Detail</Th>
                <Th align="center">Return</Th>
                <Th align="center">Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {isPending ? (
                <TableEmptyRow colSpan={5} message="Memuat data..." />
              ) : list.data.length === 0 ? (
                <TableEmptyRow colSpan={5} message="Belum ada data tujuan" />
              ) : (
                list.data.map((item) => (
                    <tr
                      key={item.id_tujuan}
                      className="border-b border-[#EFEAE5] hover:bg-gray-50/60"
                    >
                      <Td>
                        <span className="font-medium">{item.nama_tujuan}</span>
                      </Td>
                      <Td align="center">
                        <Badge
                          variant="secondary"
                          className="rounded-full border-0 bg-[#FFF5F5] text-[#D32F2F]"
                        >
                          {JENIS_DETAIL_LABEL[item.jenis_detail]}
                        </Badge>
                      </Td>
                      <Td align="center" className="text-[#6B7280]">
                        {item.label_detail || "-"}
                      </Td>
                      <Td align="center">
                        {item.boleh_return ? "Ya" : "Tidak"}
                      </Td>
                      <Td align="center" variant="action">
                        <div className="flex justify-center">
                          <div className="flex w-[220px] items-center justify-start gap-2">
                            <TextOutlineAction
                              label="Edit"
                              onClick={() => modal.openEdit(item.id_tujuan)}
                            />

                              <DeleteAction
                              onClick={() => setDeleteId(item.id_tujuan)}
                            />
                          </div>
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
                itemLabel="tujuan"
                onPageChange={setPage}
              />
            </div>
          )}
        </DataTableSection>
      </div>

      <FormDialog
        open={modal.open}
        onOpenChange={modal.setOpen}
        title={modal.isEdit ? "Edit Tujuan" : "Tambah Tujuan"}
        description="Atur nama, label detail di form barang keluar, dan opsi return."
        loading={modal.loading}
      >
        <TujuanForm
          key={modal.editId ?? "new"}
          initialData={modal.editData ?? undefined}
          onSubmit={handleSubmit}
          loading={modal.saving}
          onCancel={modal.close}
        />
      </FormDialog>

      <ConfirmDialog
        open={deleteId !== null}
        title="Hapus Tujuan"
        message="Apakah Anda yakin ingin menghapus kategori tujuan ini?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
}
