"use client";

import { PDFViewer, pdf } from "@react-pdf/renderer";
import { Download, FileSpreadsheet } from "lucide-react";

import {
  buildLaporanAgregatFilename,
  LaporanAgregatDocument,
} from "@/components/laporan/laporan-agregat-document";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { downloadLaporanExcel } from "@/lib/laporan-excel";
import type { LaporanGenerateResult } from "@/lib/laporan-generate";

interface Props {
  data: LaporanGenerateResult | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  downloading?: boolean;
}

export default function LaporanGeneratePreviewDialog({
  data,
  open,
  onOpenChange,
}: Props) {
  async function handleDownloadPdf() {
    if (!data) return;
    const blob = await pdf(<LaporanAgregatDocument data={data} />).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = buildLaporanAgregatFilename(data);
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleExportExcel() {
    if (!data) return;
    downloadLaporanExcel(data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[90vh] max-h-[90vh] flex-col gap-0 overflow-hidden border border-[#E5E7EB] p-0 shadow-xl sm:max-w-5xl"
        showCloseButton
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#EFEAE5] py-4 pr-14 pl-6">
          <div className="min-w-0">
            <DialogTitle className="truncate text-lg font-semibold text-[#1A1C1C]">
              Preview Laporan PDF
            </DialogTitle>
            {data && (
              <p className="mt-0.5 truncate text-xs text-[#6B7280]">
                {data.filters.jenisLabel} · {data.filters.merchandiseLabel} ·{" "}
                {data.filters.periodeLabel} · {data.summary.totalRows} baris
              </p>
            )}
          </div>
          {data && (
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export Excel
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadPdf}
              >
                <Download className="h-4 w-4" />
                Unduh PDF
              </Button>
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 bg-[#F3F4F6]">
          {!data ? (
            <div className="flex h-full items-center justify-center text-sm text-[#6B7280]">
              Data tidak ditemukan
            </div>
          ) : (
            <PDFViewer width="100%" height="100%" showToolbar>
              <LaporanAgregatDocument data={data} />
            </PDFViewer>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
