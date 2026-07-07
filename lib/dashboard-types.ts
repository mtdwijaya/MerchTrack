/** Tipe response dashboard — aman di-import dari Client Component */
export type DashboardData = {
  totalStokTersedia: number;
  totalStokDelta: number;
  totalBarangKeluarBulanIni: number;
  barangKeluarDelta: number;
  merchandiseTerbanyak: string | null;
  merchandiseTerbanyakQty: number;
  transaksiBulanIni: {
    masuk: number;
    keluar: number;
    total: number;
    delta: number;
  };
  distribusiHariIni: number;
  distribusiHariIniDelta: number;
  peringatanStokRendah: number;
  stokRendahItems: { nama: string; jumlah: number }[];
  top5StasiunTeraktif: { nama: string; total: number }[];
  trendDistribusi: { label: string; total: number; isCurrent: boolean }[];
  top5Merchandise: { nama: string; total: number }[];
  penggunaanKategori: { nama: string; total: number }[];
  stokGudang: { id: number; nama: string; stok: number }[];
  chartMeta: {
    bulan: string;
    tahun: number;
    bulanLalu: string;
    selectedMonth: number;
    selectedYear: number;
  };
};
