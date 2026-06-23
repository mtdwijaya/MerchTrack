"use client";

import SummaryCards from "@/components/ui/summary-cards";

interface Props {
  totalTransaksi: number;
  totalBarangKeluar: number;
  totalStasiun: number;
}

export default function BarangKeluarSummary({
  totalTransaksi,
  totalBarangKeluar,
  totalStasiun,
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
          title: "Stasiun Tujuan",
          value: totalStasiun,
          subtitle: "Stasiun yang pernah menerima distribusi",
          iconSrc: "/icons/icon-red-stasiun.svg",
        },
      ]}
    />
  );
}
