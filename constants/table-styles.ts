/** Style tabel transaksi (barang keluar & riwayat) — grid penuh + zebra per transaksi */

/**
 * Zebra + hover di level <tr> via [&>td] — tidak pakai filter/brightness
 * agar garis border tetap tajam saat hover.
 */
export function transactionStripeRowClass(index: number) {
  return index % 2 === 0
    ? "[&>td]:bg-white [&:hover>td]:bg-[#F3F4F6]"
    : "[&>td]:bg-[#EEF2F7] [&:hover>td]:bg-[#E4EAF1]";
}

/** @deprecated pakai transactionStripeRowClass */
export function transactionStripeBg(index: number) {
  return transactionStripeRowClass(index);
}

/** Class untuk <table> agar semua th/td ber-border (header style tetap dari Th) */
export const TABLE_FULL_GRID =
  "[&_th]:border [&_th]:border-[#D1D5DB] [&_td]:border [&_td]:border-[#D1D5DB]";
