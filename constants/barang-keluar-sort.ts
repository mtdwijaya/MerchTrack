/** Opsi urutkan list transaksi barang keluar — satu sumber untuk UI filter */
export const BARANG_KELUAR_SORT_OPTIONS = [
  { value: "tanggal_keluar:desc", label: "Tanggal terbaru" },
  { value: "tanggal_keluar:asc", label: "Tanggal terlama" },
  { value: "jumlah:desc", label: "Jumlah terbesar" },
  { value: "jumlah:asc", label: "Jumlah terkecil" },
] as const;

export const BARANG_KELUAR_DEFAULT_SORT = "tanggal_keluar:desc";
