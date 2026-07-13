"use client";

import { Eye, FileSpreadsheet, Package, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getLaporanDateParts } from "@/lib/format-laporan-date";
import type { LaporanGenerateResult } from "@/lib/laporan-generate";

export type GeneratedLaporanCardItem = {
  id: string;
  data: LaporanGenerateResult;
};

interface Props {
  item: GeneratedLaporanCardItem;
  onPreview: (id: string) => void;
  onExportExcel: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function LaporanCard({
  item,
  onPreview,
  onExportExcel,
  onDelete,
}: Props) {
  const { data } = item;
  const { day, month } = getLaporanDateParts(data.generatedAt);
  const { filters, summary } = data;

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
            className="rounded-full border-0 bg-emerald-50 text-emerald-700 px-2.5 py-1 text-xs font-semibold"
          >
            Laporan {filters.jenisLabel}
          </Badge>
        </div>

        <div>
          <h3 className="text-base font-semibold text-[#1A1C1C]">
            {filters.jenisLabel}
          </h3>
          <div className="mt-2 flex flex-col gap-1.5 text-sm text-[#6B7280] sm:flex-row sm:flex-wrap sm:gap-x-4">
            <span className="inline-flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 shrink-0" />
              {filters.merchandiseLabel}
            </span>
            <span className="text-[#9CA3AF]">· {filters.periodeLabel}</span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-stretch gap-3 pr-1 sm:items-end sm:pl-4 sm:pr-3 ">
        <div className="text-right">

          <p className="text-sm font-medium text-[#1A1C1C]">
            {summary.totalKeluarTrx > 0 &&
              `${summary.totalKeluarTrx} Transaksi keluar`}
            {summary.totalKeluarTrx > 0 && summary.totalMasukTrx > 0 && " · "}
            {summary.totalMasukTrx > 0 && `${summary.totalMasukTrx} Transaksi masuk`}
            {summary.totalKeluarTrx === 0 &&
              summary.totalMasukTrx === 0 &&
              "Tidak ada transaksi"}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => onExportExcel(item.id)}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </Button>
          <Button
            type="button"
            variant="brand"
            onClick={() => onPreview(item.id)}
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          {onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-[#B1070E] hover:bg-[#FFF2F2]"
              onClick={() => onDelete(item.id)}
              aria-label="Hapus laporan"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
