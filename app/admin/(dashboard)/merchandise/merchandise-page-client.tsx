"use client";

import { useState, useTransition } from "react";

import MerchandiseForm from "@/components/merchandise/merchandise-form";
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
import SummaryCards from "@/components/ui/summary-cards";
import { DeleteAction, TextOutlineAction } from "@/components/ui/table-actions";
import { useFormModal } from "@/hooks/use-form-modal";
import { useListFilters } from "@/hooks/use-list-filters";
import { parseSortValue, toggleSortValue } from "@/lib/sort";
import { showError, showSuccess } from "@/lib/toast";

import {
  createMerchandiseAction,
  deleteMerchandiseAction,
  getMerchandiseFormData,
  updateMerchandiseAction,
} from "./actions";

type SortField = "nama_merch" | "jumlah_stok";

interface Props {
  list: {
    data: {
      id_merch: number;
      nama_merch: string;
      deskripsi: string | null;
      movement: {
        stokAwal: number;
        stokKeluar: number;
        stokDikembalikan: number;
        restock: number;
        stokAkhir: number;
      };
    }[];
    total: number;
    totalPages: number;
  };
  summary: {
    totalMerchandise: number;
    totalStok: number;
    lowStockCount: number;
  };
  pageSize: number;
  defaultSort: string;
}

export default function MerchandisePageClient({
  list,
  summary,
  pageSize,
  defaultSort,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const { search, setSearch, page, sort, setParam, setPage, resetParams } =
    useListFilters({ sort: defaultSort });

  const modal = useFormModal<{
    nama_merch: string;
    deskripsi: string;
  }>(getMerchandiseFormData);

  const [deleteId, setDeleteId] = useState<number | null>(null);

  const currentSort = sort || defaultSort;
  const { sortBy, sortOrder } = parseSortValue<SortField>(
    currentSort,
    "nama_merch"
  );

  function openAddModal() {
    modal.openAdd();
  }

  async function openEditModal(id: number) {
    modal.openEdit(id);
  }

  async function handleSubmit(data: {
    nama_merch: string;
    deskripsi: string;
    jumlah_stok?: number;
    foto?: File | null;
    hapus_foto?: boolean;
  }) {
    modal.setSaving(true);

    const formData = new FormData();
    formData.append("nama_merch", data.nama_merch);
    formData.append("deskripsi", data.deskripsi);
    if (!modal.editId) {
      formData.append("jumlah_stok", String(data.jumlah_stok ?? 0));
    }
    if (data.foto) {
      formData.append("foto", data.foto);
    }
    if (data.hapus_foto) {
      formData.append("hapus_foto", "1");
    }

    const result = modal.editId
      ? await updateMerchandiseAction(modal.editId, formData)
      : await createMerchandiseAction(formData);
    modal.setSaving(false);

    if (!result.ok) {
      showError(result.message);
      return;
    }

    showSuccess(
      modal.isEdit
        ? "Merchandise berhasil diperbarui"
        : "Merchandise berhasil ditambahkan"
    );
    modal.close();
    startTransition(() => {});
  }

  async function handleDelete() {
    if (!deleteId) return;
    const result = await deleteMerchandiseAction(deleteId);
    if (!result.ok) {
      showError(result.message);
      return;
    }
    setDeleteId(null);
    showSuccess("Merchandise berhasil dihapus");
    startTransition(() => {});
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Manajemen Merchandise"
          description="Kelola data merchandise dan stok gudang pusat."
          actions={
            <PrimaryButton onClick={openAddModal}>
              + Tambah Merchandise
            </PrimaryButton>
          }
        />

        <SummaryCards
          items={[
            {
              title: "Total Merchandise",
              value: summary.totalMerchandise,
              iconSrc: "/icons/icon-merchandise-merah.svg",
              subtitle: "Item terdaftar",
            },
            {
              title: "Total Stok",
              value: summary.totalStok,
              suffix: "Pcs",
              iconSrc: "/icons/icon-stok.svg",
              subtitle: "Akumulasi stok gudang",
            },
            {
              title: "Stok Rendah",
              value: summary.lowStockCount,
              iconSrc: "/icons/icon-barangkeluar-merah.svg",
              subtitle: "Stok di bawah 20 pcs atau habis",
              variant: "danger",
            },
          ]}
        />

        <FilterBar onReset={() => resetParams(["search", "sort"])}>
          <FilterSearch
            value={search}
            onChange={setSearch}
            placeholder="Cari nama atau deskripsi merchandise..."
          />
          <FilterSelect
            id="sort-merchandise"
            label="Urutkan"
            value={currentSort}
            onChange={(value) => setParam("sort", value)}
            placeholder="Pilih urutan..."
            options={[
              { value: "nama_merch:asc", label: "Nama (A-Z)" },
              { value: "jumlah_stok:desc", label: "Stok Akhir (Tertinggi)" },
              { value: "jumlah_stok:asc", label: "Stok Akhir (Terendah)" },
            ]}
          />
        </FilterBar>

        <DataTableSection>
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-[#EFEAE5] bg-[#FAFAFA]">
                <SortableTh
                  label="Nama"
                  field="nama_merch"
                  activeField={sortBy}
                  activeOrder={sortOrder}
                  onSort={(f) =>
                    setParam("sort", toggleSortValue(currentSort, f))
                  }
                />
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                  Deskripsi
                </th>
                <SortableTh
                  label="Stok Akhir"
                  field="jumlah_stok"
                  activeField={sortBy}
                  activeOrder={sortOrder}
                  align="center"
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
                <TableEmptyRow colSpan={4} message="Memuat data..." />
              ) : list.data.length === 0 ? (
                <TableEmptyRow colSpan={4} message="Belum ada merchandise" />
              ) : (
                list.data.map((item) => (
                  <tr
                    key={item.id_merch}
                    className="border-b border-[#EFEAE5] hover:bg-gray-50/60"
                  >
                    <Td>
                      <span className="font-medium">{item.nama_merch}</span>
                    </Td>
                    <Td className="max-w-xs truncate">
                      {item.deskripsi || "-"}
                    </Td>
                    <Td align="center" variant="numeric">
                      <span className="font-bold text-[#1A1C1C]">
                        {item.movement.stokAkhir.toLocaleString("id-ID")}
                      </span>
                    </Td>
                    <Td align="center" variant="action">
                      <div className="flex items-center justify-center gap-3">
                        <TextOutlineAction
                          label="Edit"
                          onClick={() => openEditModal(item.id_merch)}
                        />
                        <DeleteAction
                          onClick={() => setDeleteId(item.id_merch)}
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
                itemLabel="merchandise"
                onPageChange={setPage}
              />
            </div>
          )}
        </DataTableSection>
      </div>

      <FormDialog
        open={modal.open}
        onOpenChange={modal.setOpen}
        title={modal.isEdit ? "Edit Merchandise" : "Tambah Merchandise"}
        description={
          modal.isEdit
            ? "Perbarui nama, deskripsi, dan foto merchandise."
            : "Tambahkan merchandise baru ke gudang pusat."
        }
        loading={modal.loading}
      >
        <MerchandiseForm
          key={modal.editId ?? "new"}
          initialData={modal.editData ?? undefined}
          onSubmit={handleSubmit}
          loading={modal.saving}
          onCancel={modal.close}
          isEdit={modal.isEdit}
        />
      </FormDialog>

      <ConfirmDialog
        open={deleteId !== null}
        title="Hapus Merchandise"
        message="Apakah Anda yakin ingin menghapus merchandise ini?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
}
