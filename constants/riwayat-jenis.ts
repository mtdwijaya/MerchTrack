/** Jenis transaksi di riwayat unified — selaras schema + filter UI */
export const RIWAYAT_JENIS_OPTIONS = [
  { value: "KELUAR", label: "Barang Keluar" },
  { value: "MASUK", label: "Barang Masuk" },
  { value: "RESTOCK", label: "Restock" },
] as const;

export type RiwayatJenisFilter =
  (typeof RIWAYAT_JENIS_OPTIONS)[number]["value"];

export const RIWAYAT_JENIS_LABEL: Record<RiwayatJenisFilter, string> = {
  KELUAR: "Barang Keluar",
  MASUK: "Barang Masuk",
  RESTOCK: "Restock",
};
