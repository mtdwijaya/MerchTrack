export function getBarangKeluarQuantities(
  jumlah: number,
  jumlahKembali: number
) {
  return {
    keluar: jumlah + jumlahKembali,
    dikembalikan: jumlahKembali,
    terpakai: jumlah,
  };
}
