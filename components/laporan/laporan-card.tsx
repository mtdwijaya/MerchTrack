"use client";

import type { JenisDetailTujuan, StatusBarangKeluar } from "@prisma/client";
import { Eye, MapPin, User } from "lucide-react";

import StatusBarangKeluarBadge from "@/components/barang-keluar/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getLaporanCardDetailLabel,
  getLaporanCardSummary,
} from "@/components/laporan/laporan-transaksi-document";
import { formatTransaksiId } from "@/lib/format-transaksi";
import { getLaporanDateParts } from "@/lib/format-laporan-date";

export interface LaporanCardItem {
  id_keluar: number;
  jumlah: number;
  jumlah_kembali: number;
  status: StatusBarangKeluar;
  tanggal_keluar: string | Date;
  merchandise: { nama_merch: string };
  tujuan: { nama_tujuan: string; jenis_detail: JenisDetailTujuan };
  stasiun: { nama_stasiun: string } | null;
  unit: { nama_unit: string } | null;
  detail_teks: string | null;
  user: { nama_user: string };
}

interface LaporanCardProps {
  item: LaporanCardItem;
  onPreview: (id: number) => void;
}

export default function LaporanCard({ item, onPreview }: LaporanCardProps) {
  const { day, month } = getLaporanDateParts(item.tanggal_keluar);
  const detailLabel = getLaporanCardDetailLabel(item);
  const summary = getLaporanCardSummary(item.jumlah, item.jumlah_kembali);
  const returnCount = item.jumlah_kembali > 0 ? "ada pengembalian" : "";

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-[#EFEAE5] bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center">
      <div className="flex shrink-0 items-center gap-4 border-[#EFEAE5] pr-5 sm:border-r sm:pr-8">
        <div className="flex items-center gap-8 pl-4 sm:flex-col sm:gap-0 sm:text-center">
          <p className="text-2xl font-bold leading-none text-gray-700">{day}</p>
          <p className="text-sm font-bold uppercase tracking-wide text-[#6B7280] sm:mt-1">
            {month}
          </p>
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="secondary"
            className="rounded-full border-0 bg-[#FFF5F5] px-2.5 py-1 text-xs font-semibold text-[#D32F2F]"
          >
            {formatTransaksiId(item.id_keluar)}
          </Badge>
         
        </div>

        <div>
          <h3 className="text-base font-semibold text-[#1A1C1C]">
            {item.merchandise.nama_merch}
          </h3>
          <div className="mt-2 flex flex-col gap-1.5 text-sm text-[#6B7280] sm:flex-row sm:flex-wrap sm:gap-x-4">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {item.tujuan.nama_tujuan}
              {detailLabel !== item.tujuan.nama_tujuan && (
                <span className="text-[#9CA3AF]">· {detailLabel}</span>
              )}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 shrink-0" />
              {item.user.nama_user}
            </span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-stretch gap-3 pr-1 sm:items-end sm:pl-4 sm:pr-3">
        <div className="text-right">
          <p className="text-sm font-medium text-[#1A1C1C]">{summary}</p>
          {returnCount && (
            <p className="mt-0.5 text-xs text-[#6B7280]">{returnCount}</p>
          )}
        </div>
        <Button type="button" variant="brand" onClick={() => onPreview(item.id_keluar)}>
          <Eye className="h-4 w-4" />
          Preview PDF
        </Button>
      </div>
    </article>
  );
}
