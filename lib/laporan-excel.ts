import * as XLSX from "xlsx";

import { formatTransaksiDate } from "@/lib/format-transaksi";
import type { LaporanGenerateResult } from "@/lib/laporan-generate";

export function buildLaporanExcelFilename(data: LaporanGenerateResult) {
  const stamp = new Date(data.generatedAt)
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");
  return `laporan-merchtrack-${stamp}.xlsx`;
}

export function downloadLaporanExcel(data: LaporanGenerateResult) {
  const meta = [
    ["Laporan Merchandise MerchTrack"],
    ["Digenerate", formatTransaksiDate(data.generatedAt)],
    ["Jenis transaksi", data.filters.jenisLabel],
    ["Merchandise", data.filters.merchandiseLabel],
    ["Periode", data.filters.periodeLabel],
    [],
    ["Total baris", data.summary.totalRows],
    ["Trx keluar", data.summary.totalKeluarTrx],
    ["Pcs keluar (terpakai)", data.summary.totalKeluarPcs],
    ["Trx masuk", data.summary.totalMasukTrx],
    ["Pcs masuk", data.summary.totalMasukPcs],
    [],
  ];

  const header = [
    "Jenis",
    "ID",
    "Tanggal",
    "Merchandise",
    "Jumlah",
    "Dikembalikan",
    "Terpakai",
    "Tujuan",
    "Detail Tujuan",
    "Status",
    "Petugas",
    "Keterangan",
  ];

  const body = data.rows.map((row) => [
    row.jenis,
    row.id,
    formatTransaksiDate(row.tanggal),
    row.merchandise,
    row.jumlah,
    row.jumlah_kembali ?? "",
    row.terpakai ?? (row.jenis === "MASUK" ? row.jumlah : ""),
    row.tujuan ?? "",
    row.detail_tujuan ?? "",
    row.status ?? "",
    row.petugas,
    row.keterangan ?? "",
  ]);

  const sheet = XLSX.utils.aoa_to_sheet([...meta, header, ...body]);
  sheet["!cols"] = [
    { wch: 10 },
    { wch: 8 },
    { wch: 20 },
    { wch: 24 },
    { wch: 10 },
    { wch: 12 },
    { wch: 10 },
    { wch: 18 },
    { wch: 22 },
    { wch: 16 },
    { wch: 16 },
    { wch: 28 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Laporan");
  XLSX.writeFile(workbook, buildLaporanExcelFilename(data));
}
