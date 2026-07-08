"use client";

import { pdf } from "@react-pdf/renderer";
import { Download } from "lucide-react";
import { useEffect, useState } from "react";

import BuktiDocumentPreview from "@/components/ui/bukti-document-preview";

import { getBarangKeluarDetail } from "@/app/(dashboard)/barang-keluar/actions";
import { getBarangMasukDetailAction } from "@/app/(dashboard)/riwayat-transaksi/actions";
import {
  buildLaporanPdfFilename,
  LaporanTransaksiDocument,
} from "@/components/laporan/laporan-transaksi-document";
import {
  buildLaporanMasukPdfFilename,
  LaporanMasukDocument,
} from "@/components/laporan/laporan-masuk-document";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { actionButton } from "@/constants/design-tokens";
import { formatTransaksiDate } from "@/lib/format-transaksi";
import type { RiwayatJenis } from "@/lib/riwayat-transaksi";

interface RiwayatDetailDialogProps {
  jenis: RiwayatJenis | null;
  id: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function RiwayatDetailDialog({
  jenis,
  id,
  open,
  onOpenChange,
}: RiwayatDetailDialogProps) {
  const [loading, setLoading] = useState(false);
  const [keluarDetail, setKeluarDetail] = useState<
    Awaited<ReturnType<typeof getBarangKeluarDetail>> | null
  >(null);
  const [masukDetail, setMasukDetail] = useState<
    Awaited<ReturnType<typeof getBarangMasukDetailAction>> | null
  >(null);

  useEffect(() => {
    if (!open || !id || !jenis) {
      setKeluarDetail(null);
      setMasukDetail(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    if (jenis === "KELUAR") {
      getBarangKeluarDetail(id).then((data) => {
        if (!cancelled) {
          setKeluarDetail(data);
          setLoading(false);
        }
      });
    } else {
      getBarangMasukDetailAction(id).then((data) => {
        if (!cancelled) {
          setMasukDetail(data);
          setLoading(false);
        }
      });
    }

    return () => {
      cancelled = true;
    };
  }, [open, id, jenis]);

  async function handleDownload() {
    if (jenis === "KELUAR" && keluarDetail) {
      const blob = await pdf(
        <LaporanTransaksiDocument data={keluarDetail} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = buildLaporanPdfFilename(keluarDetail.id_keluar);
      link.click();
      URL.revokeObjectURL(url);
      return;
    }

    if (jenis === "MASUK" && masukDetail) {
      const blob = await pdf(
        <LaporanMasukDocument data={masukDetail} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = buildLaporanMasukPdfFilename(masukDetail.id_masuk);
      link.click();
      URL.revokeObjectURL(url);
    }
  }

  const title =
    jenis === "KELUAR"
      ? "Detail Barang Keluar"
      : jenis === "MASUK"
        ? "Detail Barang Masuk"
        : "Detail Transaksi";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto border border-[#E8E4DF] p-0 sm:max-w-3xl"
        showCloseButton
      >
        <div className="border-b border-[#E8E4DF] px-6 py-5">
          <DialogTitle className="text-lg font-semibold text-[#1A1A1A]">
            {title}
          </DialogTitle>
        </div>

        <div className="space-y-4 px-6 py-5">
          {loading ? (
            <p className="py-10 text-center text-sm text-[#9A9A9A]">
              Memuat detail...
            </p>
          ) : jenis === "KELUAR" && keluarDetail ? (
            <div className="space-y-3 text-sm">
              <InfoRow label="ID" value={`#TRX-${String(keluarDetail.id_keluar).padStart(5, "0")}`} />
              <InfoRow label="Tanggal" value={formatTransaksiDate(keluarDetail.tanggal_keluar)} />
              <InfoRow label="Merchandise" value={keluarDetail.merchandise} />
              <InfoRow label="Tujuan" value={`${keluarDetail.tujuan} · ${keluarDetail.detail_tujuan}`} />
              <InfoRow label="Barang Keluar" value={`${keluarDetail.qty.keluar} pcs`} />
              <InfoRow label="Barang Dikembalikan" value={`${keluarDetail.qty.dikembalikan} pcs`} />
              <InfoRow label="Barang Terpakai" value={`${keluarDetail.qty.terpakai} pcs`} />
              <InfoRow label="Petugas" value={keluarDetail.petugas} />
              {keluarDetail.keterangan && (
                <InfoRow label="Keterangan" value={keluarDetail.keterangan} />
              )}
              {keluarDetail.bukti_path && keluarDetail.bukti_nama && (
                <BuktiDocumentPreview
                  path={keluarDetail.bukti_path}
                  name={keluarDetail.bukti_nama}
                />
              )}
            </div>
          ) : jenis === "MASUK" && masukDetail ? (
            <div className="space-y-3 text-sm">
              <InfoRow label="ID" value={`#IN-${String(masukDetail.id_masuk).padStart(5, "0")}`} />
              <InfoRow label="Tanggal" value={formatTransaksiDate(masukDetail.tanggal_masuk)} />
              <InfoRow label="Merchandise" value={masukDetail.merchandise} />
              <InfoRow label="Jumlah Masuk" value={`${masukDetail.jumlah} pcs`} />
              <InfoRow label="Petugas" value={masukDetail.petugas} />
              {masukDetail.keterangan && (
                <InfoRow label="Keterangan" value={masukDetail.keterangan} />
              )}
              {masukDetail.bukti_path && masukDetail.bukti_nama && (
                <BuktiDocumentPreview
                  path={masukDetail.bukti_path}
                  name={masukDetail.bukti_nama}
                />
              )}
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-[#9A9A9A]">
              Data tidak ditemukan
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-[#E8E4DF] bg-[#FAFAF8] px-6 py-4">
          {(keluarDetail || masukDetail) && (
            <button
              type="button"
              onClick={handleDownload}
              className={actionButton.primary}
            >
              <Download className="h-4 w-4" />
              Unduh Laporan PDF
            </button>
          )}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={actionButton.outlineMd}
          >
            Tutup
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[#9A9A9A]">{label}</p>
      <p className="mt-0.5 font-medium text-[#1A1A1A]">{value}</p>
    </div>
  );
}
