"use client";

import SummaryCards from "@/components/ui/summary-cards";

interface Props {
  totalTransaksiBulanIni: number;
  totalBarangKeluar30Hari: number;
  stasiunTerpopuler: {
    nama_stasiun: string;
    totalDistribusi: number;
  } | null;
}

export default function RiwayatSummary({
  totalTransaksiBulanIni,
  totalBarangKeluar30Hari,
  stasiunTerpopuler,
}: Props) {
  return (
    <SummaryCards
      items={[
        {
          title: "Total Transaksi",
          value: totalTransaksiBulanIni,
          subtitle: "Terverifikasi bulan ini",
          iconSrc: "/icons/icon-transaksi-merah.svg",
        },
        {
          title: "Total Barang Keluar",
          value: totalBarangKeluar30Hari,
          suffix: "Pcs",
          subtitle: "Distribusi 30 hari terakhir",
          iconSrc: "/icons/icon-barangkeluar-merah.svg",
        },
        {
          title: "Stasiun Terpopuler",
          value: stasiunTerpopuler?.nama_stasiun ?? "-",
          subtitle: stasiunTerpopuler
            ? `${stasiunTerpopuler.totalDistribusi} distribusi aktif`
            : "Belum ada data distribusi",
          iconSrc: "/icons/icon-red-stasiun.svg",
          isTextValue: true,
        },
      ]}
    />
  );
}
