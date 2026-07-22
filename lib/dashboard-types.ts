/** Tipe response dashboard — aman di-import dari Client Component */
export type DashboardData = {
  totalStokTersedia: number;
  /** Barang keluar all-time (pcs) */
  totalBarangKeluar: number;
  merchandiseTerbanyak: string | null;
  merchandiseTerbanyakQty: number;
  /** Transaksi all-time */
  totalTransaksi: {
    masuk: number;
    keluar: number;
    total: number;
  };
  distribusiHariIni: number;
  distribusiHariIniDelta: number;
  peringatanStokRendah: number;
  stokRendahItems: { nama: string; jumlah: number }[];
  /** Top merchandise all-time (untuk chart horizontal) */
  topMerchandise: { nama: string; total: number }[];
  /**
   * Transaksi barang keluar per bulan × merchandise (tahun chart).
   * Tiap bulan punya map nama_merch → qty.
   */
  transaksiPerBulan: {
    label: string;
    month: number;
    byMerchandise: Record<string, number>;
    isCurrent: boolean;
  }[];
  /** Flow sankey merch → tujuan (sudah difilter periode chart bila ada) */
  sankeyLinks: {
    source: string;
    target: string;
    value: number;
  }[];
  stokGudang: { id: number; nama: string; stok: number }[];
  chartMeta: {
    chartYear: number;
    sankeyMonth: number | null;
    sankeyYear: number | null;
    sankeyAllTime: boolean;
  };
};
