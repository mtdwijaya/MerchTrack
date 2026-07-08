"use client";

import SummaryCards from "@/components/ui/summary-cards";

/** ringkasan transaksi keluar untuk halaman laporan */
interface LaporanSummaryProps {
  totalTransaksiBulanIni: number;
  totalBarangKeluar30Hari: number;
  tujuanTerpopuler: {
    nama_tujuan: string;
    totalDistribusi: number;
  } | null;
}

/** ringkasan gabungan keluar & masuk untuk halaman riwayat */
interface UnifiedSummaryProps {
  transaksiMasukBulanIni: number;
  transaksiKeluarBulanIni: number;
  totalBarangKeluarBulanIni: number;
  totalBarangMasukBulanIni: number;
}

type Props =
  | ({ variant: "laporan" } & LaporanSummaryProps)
  | ({ variant?: "unified" } & UnifiedSummaryProps);

const bulanIniLabel = "Bulan ini";

export default function RiwayatSummary(props: Props) {
  if (props.variant === "laporan") {
    const { totalTransaksiBulanIni, totalBarangKeluar30Hari, tujuanTerpopuler } =
      props;

    return (
      <SummaryCards
        items={[
          {
            title: "Total Transaksi",
            value: totalTransaksiBulanIni,
            subtitle: "Barang keluar bulan ini",
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
            title: "Tujuan Terpopuler",
            value: tujuanTerpopuler?.nama_tujuan ?? "-",
            subtitle: tujuanTerpopuler
              ? `${tujuanTerpopuler.totalDistribusi} transaksi aktif`
              : "Belum ada data distribusi",
            iconSrc: "/icons/icon-red-stasiun.svg",
            isTextValue: true,
          },
        ]}
      />
    );
  }

  const {
    transaksiMasukBulanIni,
    transaksiKeluarBulanIni,
    totalBarangKeluarBulanIni,
    totalBarangMasukBulanIni,
  } = props;

  return (
    <SummaryCards
      columns={4}
      items={[
        {
          title: "Transaksi Masuk",
          value: transaksiMasukBulanIni,
          subtitle: bulanIniLabel,
          iconSrc: "/icons/icon-stok.svg",
        },
        {
          title: "Transaksi Keluar",
          value: transaksiKeluarBulanIni,
          subtitle: bulanIniLabel,
          iconSrc: "/icons/icon-transaksi-merah.svg",
        },
        {
          title: "Total Barang Keluar",
          value: totalBarangKeluarBulanIni,
          suffix: "Pcs",
          subtitle: bulanIniLabel,
          iconSrc: "/icons/icon-barangkeluar-merah.svg",
        },
        {
          title: "Total Barang Masuk",
          value: totalBarangMasukBulanIni,
          suffix: "Pcs",
          subtitle: bulanIniLabel,
          iconSrc: "/icons/icon-merchandise-merah.svg",
        },
      ]}
    />
  );
}
