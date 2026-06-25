"use client";

import { useState, useTransition } from "react";

import MerchandiseForm from "@/components/merchandise/merchandise-form";
import MerchandiseRestockForm from "@/components/merchandise/merchandise-restock-form";
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
import { DeleteAction, EditAction, RestockAction } from "@/components/ui/table-actions";
import { useFormModal } from "@/hooks/use-form-modal";
import { useListFilters } from "@/hooks/use-list-filters";
import { parseSortValue, toggleSortValue } from "@/lib/sort";
import { showError, showSuccess } from "@/lib/toast";

import {
  createMerchandiseAction,
  deleteMerchandiseAction,
  getMerchandiseFormData,
  getMerchandiseRestockData,
  restockMerchandiseAction,
  updateMerchandiseAction,
} from "./actions";

type SortField = "nama_merch" | "jumlah_stok";

interface Props {
  list: {
    data: {
      id_merch: number;
      nama_merch: string;
      deskripsi: string | null;
      stok: { jumlah_stok: number } | null;
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
  const [restock, setRestock] = useState<{
    id: number | null;
    open: boolean;
    loading: boolean;
    saving: boolean;
    data: { nama_merch: string; jumlah_stok: number } | null;
  }>({
    id: null,
    open: false,
    loading: false,
    saving: false,
    data: null,
  });

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

  async function openRestockModal(id: number) {
    setRestock({
      id,
      open: true,
      loading: true,
      saving: false,
      data: null,
    });

    const data = await getMerchandiseRestockData(id);
    if (!data) {
      showError("Merchandise tidak ditemukan");
      setRestock({
        id: null,
        open: false,
        loading: false,
        saving: false,
        data: null,
      });
      return;
    }

    setRestock({
      id,
      open: true,
      loading: false,
      saving: false,
      data,
    });
  }

  async function handleSubmit(data: {
    nama_merch: string;
    deskripsi: string;
    jumlah_stok?: number;
  }) {
    modal.setSaving(true);
    const result = modal.editId
      ? await updateMerchandiseAction(modal.editId, {
          nama_merch: data.nama_merch,
          deskripsi: data.deskripsi,
        })
      : await createMerchandiseAction({
          nama_merch: data.nama_merch,
          deskripsi: data.deskripsi,
          jumlah_stok: data.jumlah_stok ?? 0,
        });
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

  async function handleRestock(data: { jumlah: number; keterangan: string }) {
    if (!restock.id) return;

    setRestock((prev) => ({ ...prev, saving: true }));
    const result = await restockMerchandiseAction(restock.id, data);
    setRestock((prev) => ({ ...prev, saving: false }));

    if (!result.ok) {
      showError(result.message);
      return;
    }

    showSuccess("Stok berhasil ditambahkan");
    setRestock({
      id: null,
      open: false,
      loading: false,
      saving: false,
      data: null,
    });
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
              subtitle: "Perlu perhatian",
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
              { value: "jumlah_stok:desc", label: "Stok (Tertinggi)" },
              { value: "jumlah_stok:asc", label: "Stok (Terendah)" },
            ]}
          />
        </FilterBar>

        <DataTableSection>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#EFEAE5] bg-[#FAFAFA]">
                <SortableTh
                  label="Nama Merchandise"
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
                  label="Stok"
                  field="jumlah_stok"
                  activeField={sortBy}
                  activeOrder={sortOrder}
                  onSort={(f) =>
                    setParam("sort", toggleSortValue(currentSort, f))
                  }
                />
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
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
                    <Td>
                      {item.stok?.jumlah_stok.toLocaleString("id-ID") ?? 0}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <RestockAction
                          onClick={() => openRestockModal(item.id_merch)}
                        />
                        <EditAction
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
            ? "Perbarui nama dan deskripsi merchandise."
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

      <FormDialog
        open={restock.open}
        onOpenChange={(open) => {
          if (!open) {
            setRestock({
              id: null,
              open: false,
              loading: false,
              saving: false,
              data: null,
            });
          }
        }}
        title="Restock Merchandise"
        description="Tambahkan stok merchandise ke gudang pusat."
        loading={restock.loading}
      >
        {restock.data && restock.id && (
          <MerchandiseRestockForm
            key={restock.id}
            nama_merch={restock.data.nama_merch}
            stokSaatIni={restock.data.jumlah_stok}
            onSubmit={handleRestock}
            loading={restock.saving}
            onCancel={() =>
              setRestock({
                id: null,
                open: false,
                loading: false,
                saving: false,
                data: null,
              })
            }
          />
        )}
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
