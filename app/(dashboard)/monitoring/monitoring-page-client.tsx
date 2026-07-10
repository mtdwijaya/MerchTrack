"use client";

import type { Role, StatusBarangKeluar } from "@prisma/client";
import { ChevronRight } from "lucide-react";
import IconImage from "@/components/ui/icon-image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import {
  getBarangKeluarFormData,
  getBarangKeluarReturnInfo,
  returnBarangKeluarAction,
  updateBarangKeluarAction,
} from "@/app/(dashboard)/barang-keluar/actions";
import BarangKeluarDetailDialog from "@/components/barang-keluar/barang-keluar-detail-dialog";
import BarangKeluarForm, {
  type BarangKeluarFormSubmitData,
} from "@/components/barang-keluar/barang-keluar-form";
import BarangKembaliForm from "@/components/barang-keluar/barang-kembali-form";
import StatusBarangKeluarBadge, {
  type TujuanOption,
} from "@/components/barang-keluar/status-badge";
import TujuanCell from "@/components/barang-keluar/tujuan-cell";
import MerchandiseStockCard from "@/components/monitoring/merchandise-stock-card";
import {
  DataTable,
  DataTableSection,
  TableEmptyRow,
  Td,
  Th,
} from "@/components/ui/data-table";
import FormDialog from "@/components/ui/form-dialog";
import PageHeader from "@/components/ui/page-header";
import { DetailsAction } from "@/components/ui/table-actions";
import { useFormModal } from "@/hooks/use-form-modal";
import { useSyncedPanelHeight } from "@/hooks/use-synced-panel-height";
import { buildBarangKeluarEditFormData, buildBarangKeluarEditBatchFormData } from "@/lib/build-transaksi-form-data";
import { getBarangKeluarQuantities } from "@/lib/barang-keluar-quantities";
import { showError, showSuccess } from "@/lib/toast";
import type {
  MonitoringOverview,
  MonitoringRecentTransactions,
} from "@/lib/monitoring-overview";

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

interface ReturnInfo {
  id_keluar: number;
  merchandise: string;
  tujuan: string;
  jumlah: number;
  jumlah_kembali: number;
  sisa: number;
  status: StatusBarangKeluar;
}

interface Props {
  data: MonitoringOverview;
  recentTransactions: MonitoringRecentTransactions;
  role: Role;
  merchandiseList: MerchandiseOption[];
  stasiunList: StasiunOption[];
  unitList: UnitOption[];
  tujuanList: TujuanOption[];
}

// halaman monitoring — auto refresh tiap 15 detik + panel stok sinkron tinggi
export default function MonitoringPageClient({
  data,
  recentTransactions,
  role,
  merchandiseList,
  stasiunList,
  unitList,
  tujuanList,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const distribusiPanelRef = useRef<HTMLDivElement>(null);
  const stockPanelHeight = useSyncedPanelHeight(distribusiPanelRef);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [returnInfo, setReturnInfo] = useState<ReturnInfo | null>(null);
  const [returnSourceDetailId, setReturnSourceDetailId] = useState<
    number | null
  >(null);
  const [returnSaving, setReturnSaving] = useState(false);
  const [returnLoading, setReturnLoading] = useState(false);

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
    const info = await getBarangKeluarReturnInfo(id);
    setReturnLoading(false);

    if (!info) {
      showError("Data transaksi tidak ditemukan");
      return;
    }

    if (info.sisa <= 0) {
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

  function handleReturnFromDetail(itemId: number) {
    if (detailId) {
      setReturnSourceDetailId(detailId);
    }
    void openReturnModal(itemId);
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
    jumlah_kembali: number;
    tanggal_kembali: string;
    pengembali: string;
    asal: string;
    keterangan: string;
  }) {
    if (!returnInfo) return;

    setReturnSaving(true);
    const result = await returnBarangKeluarAction(returnInfo.id_keluar, data);
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
        title="Monitoring"
        description={
          role === "ADMIN"
            ? "Ringkasan stok dan distribusi per tujuan. Diperbarui otomatis setiap 15 detik."
            : "Ringkasan stok dan distribusi per tujuan. Diperbarui otomatis setiap 15 detik."
        }
      />
      {/* card summary */}
      <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <SummaryMetric
          label="Total Stok Aktif"
          value={data.summary.totalStokAktif}
          suffix="pcs"
          iconSrc="/icons/icon-stok.svg"
          subtitle="Stok tersedia di gudang"
        />
        <SummaryMetric
          label="Total Merchandise"
          value={data.summary.totalMerchandise}
          suffix="item"
          iconSrc="/icons/icon-merchandise-merah.svg"
          subtitle="Jenis merchandise "
        />
        <SummaryMetric
          label="Distribusi Bulan Ini"
          value={data.summary.distribusiBulanIni}
          suffix="pcs"
          iconSrc="/icons/icon-barangkeluar-merah.svg"
          subtitle={
            data.topMerchandise[0]
              ? `Terbanyak : ${data.topMerchandise[0].nama}`
              : "Belum ada distribusi bulan ini"
          }
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
          href={
            data.summary.peringatanStokRendah > 0 ? "/merchandise" : undefined
          }
        />
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3 xl:items-start">
        <div
          ref={distribusiPanelRef}
          className="flex flex-col rounded-2xl border border-[#EFEAE5] bg-white p-6 shadow-sm xl:col-span-1"
        >
          {/* card top merchandise digunakan */}
          <h2 className="text-lg font-semibold text-[#1A1C1C]">
            Top 5 Merchandise Digunakan
          </h2>

          {/* list top merchandise digunakan */}
          <div className="mt-5 space-y-4">
            {data.topMerchandise.length === 0 ? ( // kalo belom ada data
              <p className="text-sm text-[#6B7280]">Belum ada data distribusi</p>
            ) : (
              // kalo ada data, map data ke card
              data.topMerchandise.map((item) => (
                <div
                  key={item.id_merch}
                  className="flex items-center justify-between gap-4 border-b border-[#F3F4F6] pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#1A1C1C]">
                      {item.nama}
                    </p>
                    <p className="mt-1 text-sm text-gray-400">
                      Stok tersisa: {item.stokTersisa.toLocaleString("id-ID")} pcs
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-[#1A1C1C]">
                    {item.total.toLocaleString("id-ID")} pcs
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div
          className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#EFEAE5] bg-white p-6 shadow-sm xl:col-span-2"
          style={stockPanelHeight ? { height: stockPanelHeight } : undefined}
        >
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#1A1C1C]">
                Stok Merchandise
              </h2>
              <p className="mt-1 text-sm text-[#6B7280]">
                Ketersediaan stok setiap merchandise di gudang saat ini.
              </p>
            </div>
            <Link
              href="/merchandise"
              className="shrink-0 text-sm font-semibold text-[#B1070E] hover:underline"
            >
              Kelola Merchandise
            </Link>
          </div>

          {/* tinggi panel ikut Top 5; isi scroll kalo kebanyakan (4 kolom) */}
          <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-4">
              {data.merchandiseStock.length === 0 ? (
                <p className="col-span-full text-sm text-[#6B7280]">
                  Belum ada merchandise terdaftar
                </p>
              ) : (
                data.merchandiseStock.map((item) => (
                  <MerchandiseStockCard key={item.id_merch} item={item} />
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <DataTableSection>
        <div className="flex items-center justify-between border-b border-[#EFEAE5] px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-[#1A1C1C]">
              Transaksi Terbaru
            </h2>
            <p className="mt-1 text-sm text-[#6B7280]">
              10 transaksi terakhir — bisa return & edit dari detail
            </p>
          </div>
        </div>

        <DataTable>
          <thead>
            <tr className="border-b border-[#EFEAE5] bg-[#FAFAFA]">
              <Th>Tanggal</Th>
              <Th>Merchandise</Th>
              <Th align="center">Terpakai</Th>
              <Th>Tujuan</Th>
              <Th align="center">Status</Th>
              <Th align="center">Aksi</Th>
            </tr>
          </thead>
          <tbody>
            {returnLoading ? (
              <TableEmptyRow colSpan={6} message="Memuat data..." />
            ) : recentTransactions.length === 0 ? (
              <TableEmptyRow colSpan={6} message="Belum ada transaksi" />
            ) : (
              recentTransactions.map((item) => {
                const qty = getBarangKeluarQuantities(
                  item.jumlah,
                  item.jumlah_kembali
                );

                return (
                <tr
                  key={item.id_keluar}
                  className="border-b border-[#EFEAE5] last:border-b-0 hover:bg-gray-50/60"
                >
                  <Td variant="numeric" align="left">
                    {new Date(item.tanggal_keluar).toLocaleDateString("id-ID")}
                  </Td>
                  <Td variant="truncate">{item.merchandise.nama_merch}</Td>
                  <Td variant="numeric" align="center">
                    {qty.terpakai.toLocaleString("id-ID")}
                  </Td>
                  <Td>
                    <TujuanCell item={item} />
                  </Td>
                  <Td align="center">
                    <StatusBarangKeluarBadge
                      status={item.status as StatusBarangKeluar}
                    />
                  </Td>
                  <Td variant="action" align="center">
                    <DetailsAction
                      onClick={() => setDetailId(item.id_keluar)}
                    />
                  </Td>
                </tr>
                );
              })
            )}
          </tbody>
        </DataTable>
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
      description="Catat barang yang kembali ke gudang dari transaksi ini."
      contentClassName="sm:max-w-xl"
    >
      {returnInfo && (
        <BarangKembaliForm
          key={returnInfo.id_keluar}
          info={returnInfo}
          onSubmit={handleReturn}
          loading={returnSaving}
          onCancel={closeReturnModal}
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
