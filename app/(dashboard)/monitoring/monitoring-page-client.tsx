"use client";

import type { Role } from "@prisma/client";
import { ChevronRight } from "lucide-react";
import IconImage from "@/components/ui/icon-image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import {
  getBarangKeluarFormData,
  getBarangKeluarGroupReturnInfo,
  returnBarangKeluarBatchAction,
  updateBarangKeluarAction,
} from "@/app/(dashboard)/barang-keluar/actions";
import {
  getMerchandiseRestockData,
  restockMerchandiseAction,
} from "@/app/(dashboard)/merchandise/actions";
import BarangKeluarDetailDialog from "@/components/barang-keluar/barang-keluar-detail-dialog";
import BarangKeluarForm, {
  type BarangKeluarFormSubmitData,
} from "@/components/barang-keluar/barang-keluar-form";
import BarangKembaliForm from "@/components/barang-keluar/barang-kembali-form";
import MerchandiseRestockForm from "@/components/merchandise/merchandise-restock-form";
import MerchandiseStockCard from "@/components/monitoring/merchandise-stock-card";
import MonitoringActivityTable from "@/components/monitoring/monitoring-activity-table";
import {
  DataTableSection,
} from "@/components/ui/data-table";
import FormDialog from "@/components/ui/form-dialog";
import PageHeader from "@/components/ui/page-header";
import Pagination from "@/components/ui/pagination";
import { useFormModal } from "@/hooks/use-form-modal";
import { useListFilters } from "@/hooks/use-list-filters";
import { buildBarangKeluarEditFormData, buildBarangKeluarEditBatchFormData } from "@/lib/build-transaksi-form-data";
import { buildRestockFormData } from "@/lib/build-transaksi-form-data";
import { showError, showSuccess } from "@/lib/toast";
import type { MonitoringOverview } from "@/lib/monitoring-overview";
import type { RecentActivityItem } from "@/lib/recent-activity";

const REFRESH_INTERVAL_MS = 15_000;

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
  data: MonitoringOverview;
  activityList: {
    data: RecentActivityItem[];
    total: number;
    totalPages: number;
    page: number;
  };
  pageSize: number;
  role: Role;
  merchandiseList: MerchandiseOption[];
  stasiunList: StasiunOption[];
  unitList: UnitOption[];
  tujuanList: import("@/components/barang-keluar/status-badge").TujuanOption[];
}

// halaman monitoring — auto refresh tiap 15 detik + panel stok sinkron tinggi
export default function MonitoringPageClient({
  data,
  activityList,
  pageSize,
  role,
  merchandiseList,
  stasiunList,
  unitList,
  tujuanList,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { setPage } = useListFilters();

  useEffect(() => {
    if (window.location.hash !== "#aktivitas-terbaru") return;

    const scrollToActivity = () => {
      document
        .getElementById("aktivitas-terbaru")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    scrollToActivity();
    const frame = requestAnimationFrame(scrollToActivity);
    return () => cancelAnimationFrame(frame);
  }, []);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [returnInfo, setReturnInfo] = useState<GroupReturnInfo | null>(null);
  const [returnSourceDetailId, setReturnSourceDetailId] = useState<
    number | null
  >(null);
  const [returnSaving, setReturnSaving] = useState(false);
  const [returnLoading, setReturnLoading] = useState(false);
  const [restock, setRestock] = useState<{
    open: boolean;
    id: number | null;
    loading: boolean;
    saving: boolean;
    data: { nama_merch: string; jumlah_stok: number } | null;
  }>({
    open: false,
    id: null,
    loading: false,
    saving: false,
    data: null,
  });

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

  async function openRestockModal(idMerch: number) {
    setRestock({
      open: true,
      id: idMerch,
      loading: true,
      saving: false,
      data: null,
    });
    const data = await getMerchandiseRestockData(idMerch);
    if (!data) {
      showError("Merchandise tidak ditemukan");
      setRestock({
        open: false,
        id: null,
        loading: false,
        saving: false,
        data: null,
      });
      return;
    }
    setRestock({
      open: true,
      id: idMerch,
      loading: false,
      saving: false,
      data,
    });
  }

  async function handleRestock(
    data: { jumlah: number; keterangan: string },
    bukti?: File | null
  ) {
    if (!restock.id) return;
    setRestock((prev) => ({ ...prev, saving: true }));
    const result = await restockMerchandiseAction(
      restock.id,
      buildRestockFormData(data, bukti)
    );
    setRestock((prev) => ({ ...prev, saving: false }));
    if (!result.ok) {
      showError(result.message);
      return;
    }
    showSuccess("Restock berhasil");
    setRestock({
      open: false,
      id: null,
      loading: false,
      saving: false,
      data: null,
    });
    startTransition(() => router.refresh());
  }

  async function handleSubmit(
    data: BarangKeluarFormSubmitData,
    bukti?: File | null
  ) {
    if (!modal.editId) return;

    modal.setSaving(true);

    const isMultiEdit =
      data.items.length > 1 && data.items.every((item) => item.id_keluar);

    const result = await updateBarangKeluarAction(
      modal.editId,
      isMultiEdit
        ? buildBarangKeluarEditBatchFormData(
            {
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
    );
    modal.setSaving(false);

    if (!result.ok) {
      showError(result.message);
      return;
    }

    showSuccess("Data berhasil diperbarui");
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

  useEffect(() => {
    // polling ringan biar angka monitoring ke-update tanpa reload manual
    const interval = setInterval(() => {
      router.refresh();
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <>
    <div className="space-y-6">
      <PageHeader
        title="Monitoring Merchandise"
        description="Ringkasan stok merchandise. Diperbarui otomatis setiap 15 detik."
      />
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryMetric
          label="Total Stok Aktif"
          value={data.summary.totalStokAktif}
          suffix="pcs"
          iconSrc="/icons/icon-stok.svg"
          subtitle="Stok tersedia di gudang"
        />
        <SummaryMetric
          label="Jenis Merchandise"
          value={data.summary.jenisMerchandise}
          suffix="jenis"
          iconSrc="/icons/icon-merchandise-merah.svg"
          subtitle="Jumlah jenis merchandise"
        />
        <SummaryMetric
          label="Peringatan Stok Rendah"
          value={data.summary.peringatanStokRendah}
          suffix="item"
          iconSrc="/icons/icon-merchandise-merah.svg"
          variant="danger"
          subtitle={
            data.lowStockItems[0]
              ? `${data.lowStockItems[0].nama} (${data.lowStockItems[0].jumlah} pcs)`
              : "Semua stok aman"
          }
          showChevron={data.summary.peringatanStokRendah > 0}
        />
      </section>

      <section className="rounded-2xl border border-[#EFEAE5] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#1A1C1C]">
              Stok Merchandise
            </h2>
            <p className="mt-1 text-sm text-[#6B7280]">
              Format stok: dipakai / sisa. Restock dari kartu masing-masing.
            </p>
          </div>
          {role === "ADMIN" && (
            <Link
              href="/merchandise"
              className="shrink-0 text-sm font-semibold text-[#B1070E] hover:underline"
            >
              Master Merchandise
            </Link>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {data.merchandiseStock.length === 0 ? (
            <p className="col-span-full text-sm text-[#6B7280]">
              Belum ada merchandise terdaftar
            </p>
          ) : (
            data.merchandiseStock.map((item) => (
              <MerchandiseStockCard
                key={item.id_merch}
                item={item}
                onRestock={role === "ADMIN" ? openRestockModal : undefined}
              />
            ))
          )}
        </div>
      </section>

      <DataTableSection id="aktivitas-terbaru" className="scroll-mt-20">
        <div className="flex items-center justify-between border-b border-[#EFEAE5] px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-[#1A1C1C]">
              Aktivitas Terbaru
            </h2>
            <p className="mt-1 text-sm text-[#6B7280]">
              Semua log barang keluar, pengembalian, restock, dan edit transaksi
            </p>
          </div>
        </div>

        <MonitoringActivityTable
          items={activityList.data}
          loading={returnLoading}
          onOpenDetail={setDetailId}
        />

        {activityList.total > 0 && (
          <div className="border-t border-[#EFEAE5] px-6 py-4">
            <Pagination
              currentPage={activityList.page}
              totalPages={activityList.totalPages}
              totalItems={activityList.total}
              pageSize={pageSize}
              itemLabel="aktivitas"
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
    />

    <FormDialog
      open={modal.open}
      onOpenChange={modal.setOpen}
      title="Edit Barang Keluar"
      description="Perbarui data transaksi barang keluar."
      loading={modal.loading}
      contentClassName="sm:max-w-2xl"
    >
      <BarangKeluarForm
        key={modal.editId ?? "edit"}
        initialData={modal.editData ?? undefined}
        onSubmit={handleSubmit}
        loading={modal.saving}
        onCancel={modal.close}
        isEdit
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

    <FormDialog
      open={restock.open}
      onOpenChange={(open) => {
        if (!open) {
          setRestock({
            open: false,
            id: null,
            loading: false,
            saving: false,
            data: null,
          });
        }
      }}
      title="Restock Merchandise"
      description="Tambah stok merchandise di gudang."
      loading={restock.loading}
      contentClassName="sm:max-w-lg"
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
              open: false,
              id: null,
              loading: false,
              saving: false,
              data: null,
            })
          }
        />
      )}
    </FormDialog>
    </>
  );
}

function SummaryMetric({
  label,
  value,
  suffix,
  subtitle,
  iconSrc,
  variant = "default",
  showChevron,
  href,
}: {
  label: string;
  value: number;
  suffix?: string;
  subtitle?: string;
  iconSrc: string;
  variant?: "default" | "danger";
  showChevron?: boolean;
  href?: string;
}) {
  const isDanger = variant === "danger";

  const content = (
    <div
      className={`h-full min-h-[154px] rounded-2xl border p-6 shadow-sm ${
        isDanger
          ? "border-[#B1070E] bg-[#B01B1C] text-white"
          : "border-[#EFEAE5] bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p
            className={`text-xs font-semibold uppercase tracking-wide ${
              isDanger ? "text-white/90" : "text-[#6B7280]"
            }`}
          >
            {label}
          </p>
          <div className="mt-3 flex items-end gap-2">
            <p
              className={`text-3xl font-bold ${
                isDanger ? "text-white" : "text-[#1A1C1C]"
              }`}
            >
              {value.toLocaleString("id-ID")}
            </p>
            {suffix && (
              <span
                className={`pb-1 text-sm ${
                  isDanger ? "text-white/80" : "text-[#6B7280]"
                }`}
              >
                {suffix}
              </span>
            )}
          </div>

          {subtitle ? (
            <p
              className={`mt-2 line-clamp-1 text-sm ${
                isDanger ? "text-white/85" : "text-[#6B7280]"
              }`}
            >
              {subtitle}
              {showChevron && (
                <ChevronRight size={12} className="ml-0.5 inline" />
              )}
            </p>
          ) : (
            // spacer biar tinggi card sama kayak barang keluar yang punya subtitle
            <div className="mt-2 min-h-5" aria-hidden />
          )}
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            isDanger ? "bg-white/20" : "bg-[#FFF2F2]"
          }`}
        >
          <IconImage
            src={iconSrc}
            size={22}
            className={isDanger ? "brightness-0 invert" : ""}
          />
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full transition hover:opacity-95">
        {content}
      </Link>
    );
  }

  return content;
}
