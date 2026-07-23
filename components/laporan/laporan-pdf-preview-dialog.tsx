"use client";

import { PDFViewer, pdf } from "@react-pdf/renderer";
import { Download } from "lucide-react";
import { useEffect, useState } from "react";

import { getBarangKeluarDetail } from "@/app/admin/(dashboard)/barang-keluar/actions";
import {
  buildLaporanPdfFilename,
  LaporanTransaksiDocument,
  type LaporanPdfData,
} from "@/components/laporan/laporan-transaksi-document";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

interface LaporanPdfPreviewDialogProps {
  id: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LaporanPdfPreviewDialog({
  id,
  open,
  onOpenChange,
}: LaporanPdfPreviewDialogProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<LaporanPdfData | null>(null);

  useEffect(() => {
    if (!open || !id) {
      setData(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getBarangKeluarDetail(id).then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [open, id]);

  async function handleDownload() {
    if (!data) return;
    const blob = await pdf(<LaporanTransaksiDocument data={data} />).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = buildLaporanPdfFilename(data.id_keluar);
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[90vh] max-h-[90vh] flex-col gap-0 overflow-hidden border border-[#E5E7EB] p-0 shadow-xl sm:max-w-4xl"
        showCloseButton
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#EFEAE5] py-4 pr-14 pl-6">
          <DialogTitle className="min-w-0 truncate text-lg font-semibold text-[#1A1C1C]">
            Preview Laporan PDF
          </DialogTitle>
          {data && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
              Unduh
            </Button>
          )}
        </div>

        <div className="min-h-0 flex-1 bg-[#F3F4F6]">
          {loading || !data ? (
            <div className="flex h-full items-center justify-center text-sm text-[#6B7280]">
              {loading ? "Menyiapkan laporan..." : "Data tidak ditemukan"}
            </div>
          ) : (
            <PDFViewer width="100%" height="100%" showToolbar>
              <LaporanTransaksiDocument data={data} />
            </PDFViewer>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
