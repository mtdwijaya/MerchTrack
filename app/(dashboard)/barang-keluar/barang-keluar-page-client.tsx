"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import BarangKeluarDetailDialog from "@/components/barang-keluar/barang-keluar-detail-dialog";
import BarangKeluarForm from "@/components/barang-keluar/barang-keluar-form";
import BarangKeluarGroupTableRow from "@/components/barang-keluar/barang-keluar-group-table-row";
import BarangKembaliForm from "@/components/barang-keluar/barang-kembali-form";
import {
  type TujuanOption,
} from "@/components/barang-keluar/status-badge";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import {
  DataTable,
  DataTableSection,
  SortableTh,
  TableEmptyRow,
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
import {
  BARANG_KELUAR_SORT_OPTIONS,
} from "@/constants/barang-keluar-sort";
import { TABLE_FULL_GRID } from "@/constants/table-styles";
import { useFormModal } from "@/hooks/use-form-modal";
import { useListFilters } from "@/hooks/use-list-filters";
import type { BarangKeluarGroupRow } from "@/lib/barang-keluar-group";
import { buildBarangKeluarEditFormData, buildBarangKeluarEditBatchFormData, buildBarangKeluarFormData } from "@/lib/build-transaksi-form-data";
import { parseSortValue, toggleSortValue } from "@/lib/sort";
import { showError, showSuccess } from "@/lib/toast";

import {
  createBarangKeluarAction,
  deleteBarangKeluarAction,
  getBarangKeluarFormData,
  getBarangKeluarGroupReturnInfo,
  returnBarangKeluarBatchAction,
  updateBarangKeluarAction,
} from "./actions";

type SortField = "tanggal_keluar" | "jumlah";

interface MerchandiseOption {
  id_merch: number;
  nama_merch: string;
  jumlah_stok: number;
}

interface StasiunOption {
  id_stasiun: number;
  nama_stasiun: string;
}

interface UnitOption {
  id_unit: number;
  nama_unit: string;
}

interface GroupReturnInfo {
  tujuan: string;
  boleh_return: boolean;
  items: {
    id_keluar: number;
    merchandise: string;
    jumlah: number;
    jumlah_kembali: number;
    sisa: number;
  }[];
}

interface Props {
  list: {
    data: (Omit<BarangKeluarGroupRow, "tanggal_keluar"> & {
      tanggal_keluar: string | Date;
    })[];
    total: number;
    totalPages: number;
  };
  merchandiseList: MerchandiseOption[];
  stasiunList: StasiunOption[];
  unitList: UnitOption[];
  tujuanList: TujuanOption[];
  pageSize: number;
  defaultSort: string;
  openModal?: boolean;
}

export default function BarangKeluarPageClient({
  list,
  merchandiseList,
  stasiunList,
  unitList,
  tujuanList,
  pageSize,
  defaultSort,
  openModal: openModalParam,
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
    replaceParams,
  } = useListFilters({ sort: defaultSort });

  const tujuanFilter = getParam("id_tujuan");

  const modal = useFormModal<{
    id_tujuan: number;
    id_stasiun: number;
    id_unit: number;
    detail_teks: string;
    jumlah_kembali: number;
    tanggal_keluar: string;
    keterangan: string;
    bukti_path?: string | null;
    bukti_nama?: string | null;
    items: {
      id_keluar: number;
      id_merch: number;
      jumlah: number;
      jumlah_kembali: number;
    }[];
  }>(getBarangKeluarFormData);

  const [detailId, setDetailId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [returnInfo, setReturnInfo] = useState<GroupReturnInfo | null>(null);
  const [returnSourceDetailId, setReturnSourceDetailId] = useState<
    number | null
  >(null);
  const [returnSaving, setReturnSaving] = useState(false);
  const [returnLoading, setReturnLoading] = useState(false);

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

  async function openReturnModal(id: number) {
    setReturnLoading(true);
    const info = await getBarangKeluarGroupReturnInfo(id);
    setReturnLoading(false);

    if (!info) {
      showError("Data transaksi tidak ditemukan");
      return;
    }

    if (!info.boleh_return) {
      showError("Tujuan ini tidak mengizinkan pengembalian");
      return;
    }

    if (info.items.length === 0) {
      showError("Semua barang sudah dikembalikan");
      return;
    }

    setReturnInfo(info);
  }

  function closeReturnModal() {
    const reopenDetailId = returnSourceDetailId;
    setReturnInfo(null);
    setReturnSourceDetailId(null);
    if (reopenDetailId) {
      setDetailId(reopenDetailId);
    }
  }

  function handleReturnFromDetail(groupId: number) {
    if (detailId) {
      setReturnSourceDetailId(detailId);
    }
    void openReturnModal(groupId);
  }

  async function handleSubmit(
    data: {
      nama_petugas: string;
      id_tujuan: number;
      id_stasiun?: number;
      id_unit?: number;
      detail_teks?: string;
      tanggal_keluar: string;
      keterangan: string;
      items: { id_keluar?: number; id_merch: number; jumlah: number }[];
    },
    bukti?: File | null
  ) {
    modal.setSaving(true);

    const isMultiEdit =
      modal.editId &&
      data.items.length > 1 &&
      data.items.every((item) => item.id_keluar);

    const formData = modal.editId
      ? isMultiEdit
        ? buildBarangKeluarEditBatchFormData(
            {
              nama_petugas: data.nama_petugas,
              id_tujuan: data.id_tujuan,
              id_stasiun: data.id_stasiun,
              id_unit: data.id_unit,
              detail_teks: data.detail_teks,
              tanggal_keluar: data.tanggal_keluar,
              keterangan: data.keterangan,
              items: data.items.map((item) => ({
                id_keluar: item.id_keluar!,
                id_merch: item.id_merch,
                jumlah: item.jumlah,
              })),
            },
            bukti
          )
        : buildBarangKeluarEditFormData(
            {
              nama_petugas: data.nama_petugas,
              id_merch: data.items[0]?.id_merch ?? 0,
              id_tujuan: data.id_tujuan,
              id_stasiun: data.id_stasiun,
              id_unit: data.id_unit,
              detail_teks: data.detail_teks,
              jumlah: data.items[0]?.jumlah ?? 1,
              tanggal_keluar: data.tanggal_keluar,
              keterangan: data.keterangan,
            },
            bukti
          )
      : buildBarangKeluarFormData(data, bukti);

    const result = modal.editId
      ? await updateBarangKeluarAction(modal.editId, formData)
      : await createBarangKeluarAction(formData);
    modal.setSaving(false);

    if (!result.ok) {
      showError(result.message);
      return;
    }

    showSuccess(
      modal.isEdit
        ? "Data berhasil diperbarui"
        : data.items.length > 1
          ? `${data.items.length} merchandise berhasil dicatat dalam satu transaksi`
          : "Barang keluar berhasil ditambahkan"
    );
    modal.close();
    startTransition(() => router.refresh());
  }

  async function handleReturn(data: {
    tanggal_kembali: string;
    pengembali: string;
    asal: string;
    keterangan: string;
    items: { id_keluar: number; jumlah_kembali: number }[];
  }) {
    if (!returnInfo) return;

    setReturnSaving(true);
    const result = await returnBarangKeluarBatchAction(data);
    setReturnSaving(false);

    if (!result.ok) {
      showError(result.message);
      return;
    }

    showSuccess("Pengembalian barang berhasil dicatat");
    setReturnInfo(null);
    setReturnSourceDetailId(null);
    startTransition(() => router.refresh());
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
    startTransition(() => router.refresh());
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Transaksi Barang Keluar"
          description="Kelola seluruh transaksi barang keluar."
          actions={
            <PrimaryButton onClick={openAddModal}>
              + Barang Keluar
            </PrimaryButton>
          }
        />

        <FilterBar
          onReset={() => resetParams(["search", "sort", "id_tujuan"])}
        >
          <FilterSearch
            value={search}
            onChange={setSearch}
            placeholder="Cari merchandise, tujuan, atau detail..."
          />
          <FilterSelect
            id="filter-tujuan-bk"
            label="Tujuan"
            value={tujuanFilter}
            onChange={(value) => setParam("id_tujuan", value)}
            placeholder="Pilih tujuan..."
            options={tujuanList.map((item) => ({
              value: String(item.id_tujuan),
              label: item.nama_tujuan,
            }))}
          />
          <FilterSelect
            id="sort-bk"
            label="Urutkan"
            value={currentSort}
            onChange={(value) => setParam("sort", value)}
            placeholder="Pilih urutan..."
            options={[...BARANG_KELUAR_SORT_OPTIONS]}
          />
        </FilterBar>

        <DataTableSection>
          <DataTable className={TABLE_FULL_GRID}>
            <thead>
              <tr className="bg-[#FAFAFA]">
                <SortableTh
                  label="Tanggal"
                  field="tanggal_keluar"
                  activeField={sortBy}
                  activeOrder={sortOrder}
                  align="center"
                  onSort={(f) =>
                    setParam("sort", toggleSortValue(currentSort, f))
                  }
                />
                <Th align="center">Merchandise</Th>
                <SortableTh
                  label="Jumlah"
                  field="jumlah"
                  activeField={sortBy}
                  activeOrder={sortOrder}
                  onSort={(f) =>
                    setParam("sort", toggleSortValue(currentSort, f))
                  }
                  align="center"
                />
                <Th align="center">Tujuan</Th>
                <Th align="center">Status</Th>
                <Th align="center">Petugas</Th>
                <Th align="center">Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {isPending || returnLoading ? (
                <TableEmptyRow colSpan={7} message="Memuat data..." />
              ) : list.data.length === 0 ? (
                <TableEmptyRow colSpan={7} message="Tidak ada data" />
              ) : (
                list.data.map((item, index) => (
                  <BarangKeluarGroupTableRow
                    key={item.group_key}
                    item={item}
                    stripeIndex={index}
                    onManage={setDetailId}
                    onReturn={(id) => void openReturnModal(id)}
                  />
                ))
              )}
            </tbody>
          </DataTable>

          {list.total > 0 && (
            <div className="border-t border-[#EFEAE5] px-6 py-4">
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

      <BarangKeluarDetailDialog
        id={detailId}
        open={detailId !== null}
        onOpenChange={(open) => {
          if (!open) setDetailId(null);
        }}
        onReturn={handleReturnFromDetail}
        onEdit={openEditModal}
        onDelete={setDeleteId}
      />

      <FormDialog
        open={modal.open}
        onOpenChange={modal.setOpen}
        title={modal.isEdit ? "Edit Transaksi Barang" : "Transaksi Barang"}
        description={
          modal.isEdit
            ? "Perbarui data transaksi barang keluar."
            : "Catat satu atau lebih merchandise untuk acara/tujuan yang sama."
        }
        loading={modal.loading}
        contentClassName="sm:max-w-3xl"
      >
        <BarangKeluarForm
          key={modal.editId ?? "new"}
          initialData={modal.editData ?? undefined}
          onSubmit={handleSubmit}
          loading={modal.saving}
          onCancel={modal.close}
          isEdit={modal.isEdit}
          merchandiseList={merchandiseList}
          stasiunList={stasiunList}
          unitList={unitList}
          tujuanList={tujuanList}
        />
      </FormDialog>

      <FormDialog
        open={returnInfo !== null}
        onOpenChange={(open) => {
          if (!open) closeReturnModal();
        }}
        title="Kembalikan Barang"
        description="Catat pengembalian satu atau lebih merchandise dari transaksi ini."
        contentClassName="sm:max-w-2xl"
      >
        {returnInfo && (
          <BarangKembaliForm
            key={returnInfo.items.map((i) => i.id_keluar).join("-")}
            info={returnInfo}
            onSubmit={handleReturn}
            loading={returnSaving}
            onCancel={closeReturnModal}
          />
        )}
      </FormDialog>

      <ConfirmDialog
        open={deleteId !== null}
        title="Hapus Transaksi"
        message="Apakah Anda yakin ingin menghapus transaksi ini? Semua merchandise dalam grup yang sama juga akan dihapus."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
}
