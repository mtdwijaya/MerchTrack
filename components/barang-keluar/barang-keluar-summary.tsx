"use client";

import SummaryCards from "@/components/ui/summary-cards";

interface Props {
  totalTransaksi: number;
  totalBarangKeluar: number;
  merchandiseTerbanyak: {
    nama: string;
    total: number;
  } | null;
}

/** ringkasan statistik halaman barang keluar */
export default function BarangKeluarSummary({
  totalTransaksi,
  totalBarangKeluar,
  merchandiseTerbanyak,
}: Props) {
  return (
    <SummaryCards
      items={[
        {
          title: "Total Transaksi",
          value: totalTransaksi,
          subtitle: "Seluruh transaksi barang keluar",
          iconSrc: "/icons/icon-transaksi-merah.svg",
        },
        {
          title: "Total Barang Keluar",
          value: totalBarangKeluar,
          suffix: "Pcs",
          subtitle: "Akumulasi jumlah barang keluar",
          iconSrc: "/icons/icon-barangkeluar-merah.svg",
        },
        {
          title: "Barang Terbanyak Digunakan",
          value: merchandiseTerbanyak?.nama ?? "-",
          subtitle: merchandiseTerbanyak
            ? `${merchandiseTerbanyak.total.toLocaleString("id-ID")} pcs terdistribusi`
            : "Belum ada data distribusi",
          iconSrc: "/icons/icon-merchandise-merah.svg",
          isTextValue: true,
          },
      ]}
    />
  );
}
