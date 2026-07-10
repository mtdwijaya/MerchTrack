/** Field pengembali/asal — eksplisit sampai Prisma client di-refresh. */
export type BarangKembaliWithMeta = {
  id_kembali: number;
  id_keluar: number;
  id_user: number;
  jumlah_kembali: number;
  tanggal_kembali: Date;
  pengembali: string | null;
  asal: string | null;
  keterangan: string | null;
  user: { id_user: number; nama_user: string };
  barangKeluar?: {
    merchandise: { nama_merch: string };
  };
};

export type BarangKembaliCreateData = {
  id_keluar: number;
  id_user: number;
  jumlah_kembali: number;
  tanggal_kembali?: Date;
  pengembali: string;
  asal: string;
  keterangan?: string;
};

export function asBarangKembaliWithMeta(row: unknown): BarangKembaliWithMeta {
  return row as BarangKembaliWithMeta;
}

export function asBarangKembaliWithMetaList(
  rows: unknown
): BarangKembaliWithMeta[] {
  return rows as BarangKembaliWithMeta[];
}
