"use client";

import { useEffect, useMemo, useState } from "react";

import { generateLaporanAction } from "@/app/(dashboard)/laporan/actions";
import LaporanCard, {
  type GeneratedLaporanCardItem,
} from "@/components/laporan/laporan-card";
import LaporanGenerateForm, {
  type LaporanGenerateFormValues,
} from "@/components/laporan/laporan-generate-form";
import LaporanGeneratePreviewDialog from "@/components/laporan/laporan-generate-preview-dialog";
import RiwayatSummary from "@/components/riwayat-transaksi/riwayat-summary";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import FormDialog from "@/components/ui/form-dialog";
import {
  FilterBar,
  FilterDateRange,
  FilterSearch,
  FilterSelect,
} from "@/components/ui/filter-bar";
import PageHeader, { PrimaryButton } from "@/components/ui/page-header";
import { downloadLaporanExcel } from "@/lib/laporan-excel";
import type { LaporanGenerateResult } from "@/lib/laporan-generate";
import { showError, showSuccess } from "@/lib/toast";

const STORAGE_KEY = "merchtrack-laporan-generated";

interface Props {
  summary: {
    totalTransaksiBulanIni: number;
    totalBarangKeluar30Hari: number;
    tujuanTerpopuler: {
      nama_tujuan: string;
      totalDistribusi: number;
    } | null;
  };
  merchandiseList: { id_merch: number; nama_merch: string }[];
}

function loadStoredReports(): GeneratedLaporanCardItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GeneratedLaporanCardItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredReports(items: GeneratedLaporanCardItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function toDateKey(value: string | Date) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function matchesReportFilters(
  item: GeneratedLaporanCardItem,
  search: string,
  jenis: string,
  idMerch: string,
  tanggal: string,
  merchandiseName: string | null
) {
  const { filters, rows, generatedAt } = item.data;
  const q = search.trim().toLowerCase();

  if (q) {
    const haystack = [
      filters.jenisLabel,
      filters.merchandiseLabel,
      filters.periodeLabel,
      ...rows.map((row) =>
        [
          row.jenis,
          row.id,
          row.merchandise,
          row.tujuan,
          row.detail_tujuan,
          row.petugas,
          row.keterangan,
        ]
          .filter(Boolean)
          .join(" ")
      ),
    ]
      .join(" ")
      .toLowerCase();

    if (!haystack.includes(q)) return false;
  }

  if (jenis === "keluar") {
    if (filters.jenisLabel === "Barang Masuk") return false;
    const hasKeluar = rows.some((row) => row.jenis === "KELUAR");
    if (!hasKeluar && filters.jenisLabel !== "Barang Keluar") return false;
  }

  if (jenis === "masuk") {
    if (filters.jenisLabel === "Barang Keluar") return false;
    const hasMasuk = rows.some((row) => row.jenis === "MASUK");
    if (!hasMasuk && filters.jenisLabel !== "Barang Masuk") return false;
  }

  if (idMerch && merchandiseName) {
    const labelMatch =
      filters.merchandiseLabel.toLowerCase() ===
      merchandiseName.toLowerCase();
    const rowMatch = rows.some(
      (row) =>
        row.merchandise.toLowerCase() === merchandiseName.toLowerCase()
    );
    // "Semua merchandise" reports still match if rows contain the merch
    if (!labelMatch && !rowMatch) return false;
  }

  if (tanggal) {
    const hasTanggal = rows.some((row) => toDateKey(row.tanggal) === tanggal);
    if (!hasTanggal && toDateKey(generatedAt) !== tanggal) {
      return false;
    }
  }

  return true;
}

export default function LaporanPageClient({
  summary,
  merchandiseList,
}: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [reports, setReports] = useState<GeneratedLaporanCardItem[]>([]);
  const [search, setSearch] = useState("");
  const [jenis, setJenis] = useState("");
  const [idMerch, setIdMerch] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<LaporanGenerateResult | null>(
    null
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setReports(loadStoredReports());
    setHydrated(true);
  }, []);

  const merchandiseName =
    merchandiseList.find((item) => String(item.id_merch) === idMerch)
      ?.nama_merch ?? null;

  const filteredReports = useMemo(
    () =>
      reports.filter((item) =>
        matchesReportFilters(
          item,
          search,
          jenis,
          idMerch,
          tanggal,
          merchandiseName
        )
      ),
    [reports, search, jenis, idMerch, tanggal, merchandiseName]
  );

  function updateReports(next: GeneratedLaporanCardItem[]) {
    setReports(next);
    saveStoredReports(next);
  }

  function resetFilters() {
    setSearch("");
    setJenis("");
    setIdMerch("");
    setTanggal("");
  }

  async function handleGenerate(values: LaporanGenerateFormValues) {
    setGenerateLoading(true);
    const result = await generateLaporanAction({
      jenis: values.jenis,
      id_merch: values.id_merch,
      periode: values.periode,
      tanggal_dari: values.tanggal_dari || undefined,
      tanggal_sampai: values.tanggal_sampai || undefined,
    });
    setGenerateLoading(false);

    if (!result.ok) {
      showError(result.message);
      return;
    }

    const item: GeneratedLaporanCardItem = {
      id: `lap-${Date.now()}`,
      data: result.data,
    };

    updateReports([item, ...reports]);
    setGenerateOpen(false);
    showSuccess(
      result.data.summary.totalRows === 0
        ? "Laporan dibuat, tetapi tidak ada data pada filter ini"
        : "Laporan berhasil digenerate"
    );
  }

  function handlePreview(id: string) {
    const item = reports.find((report) => report.id === id);
    if (!item) return;
    setPreviewData(item.data);
    setPreviewOpen(true);
  }

  function handleExportExcel(id: string) {
    const item = reports.find((report) => report.id === id);
    if (!item) return;

    if (item.data.summary.totalRows === 0) {
      showError("Tidak ada data untuk diekspor");
      return;
    }

    downloadLaporanExcel(item.data);
    showSuccess("File Excel berhasil diunduh");
  }

  function handleDeleteConfirm() {
    if (!deleteId) return;
    updateReports(reports.filter((report) => report.id !== deleteId));
    setDeleteId(null);
    showSuccess("Laporan dihapus dari daftar");
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Laporan"
          description="Dokumentasi dan rekap transaksi barang keluar."
          actions={
            <PrimaryButton onClick={() => setGenerateOpen(true)}>
              + Generate Laporan
            </PrimaryButton>
          }
        />

        <RiwayatSummary {...summary} variant="laporan" />

        <FilterBar onReset={resetFilters}>
          <FilterSearch
            value={search}
            onChange={setSearch}
            placeholder="Cari merchandise, jenis, periode..."
          />
          <FilterSelect
            id="filter-jenis-laporan"
            label="Jenis"
            value={jenis}
            onChange={setJenis}
            placeholder="Semua jenis"
            options={[
              { value: "keluar", label: "Barang Keluar" },
              { value: "masuk", label: "Barang Masuk" },
            ]}
          />
          <FilterSelect
            id="filter-merch-laporan"
            label="Merchandise"
            value={idMerch}
            onChange={setIdMerch}
            placeholder="Semua merchandise"
            options={merchandiseList.map((item) => ({
              value: String(item.id_merch),
              label: item.nama_merch,
            }))}
          />
          <FilterDateRange
            value={tanggal}
            onChange={setTanggal}
            label="Tanggal"
          />
        </FilterBar>

        <div className="space-y-4">
          {!hydrated ? (
            <div className="rounded-2xl border border-[#EFEAE5] bg-white py-16 text-center text-sm text-[#6B7280]">
              Memuat laporan...
            </div>
          ) : reports.length === 0 ? (
            <div className="rounded-2xl border border-[#EFEAE5] bg-white py-16 text-center text-sm text-[#6B7280]">
              Belum ada laporan. Klik{" "}
              <span className="font-medium text-[#1A1C1C]">
                Generate Laporan
              </span>{" "}
              untuk membuat laporan baru.
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="rounded-2xl border border-[#EFEAE5] bg-white py-16 text-center text-sm text-[#6B7280]">
              Tidak ada laporan yang cocok dengan filter
            </div>
          ) : (
            filteredReports.map((item) => (
              <LaporanCard
                key={item.id}
                item={item}
                onPreview={handlePreview}
                onExportExcel={handleExportExcel}
                onDelete={setDeleteId}
              />
            ))
          )}
        </div>
      </div>

      <FormDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        title="Generate Laporan"
        description="Pilih jenis transaksi, merchandise, dan rentang waktu untuk membuat laporan."
        contentClassName="sm:max-w-2xl"
      >
        <LaporanGenerateForm
          merchandiseList={merchandiseList}
          loading={generateLoading}
          onCancel={() => setGenerateOpen(false)}
          onGenerate={handleGenerate}
        />
      </FormDialog>

      <LaporanGeneratePreviewDialog
        data={previewData}
        open={previewOpen && previewData !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewOpen(false);
        }}
      />

      <ConfirmDialog
        open={deleteId !== null}
        title="Hapus Laporan"
        message="Apakah Anda yakin ingin menghapus laporan ini dari daftar?"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
}
