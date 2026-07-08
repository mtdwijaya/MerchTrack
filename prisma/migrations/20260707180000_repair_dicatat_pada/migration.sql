-- Perbaiki dicatat_pada untuk transaksi yang tanggal_keluar-nya sudah diedit
-- setelah ada pengembalian (perkiraan dari tanggal pengembalian pertama).
UPDATE "BarangKeluar" bk
SET "dicatat_pada" = stats.first_kembali
FROM (
  SELECT "id_keluar", MIN("tanggal_kembali") AS first_kembali
  FROM "BarangKembali"
  GROUP BY "id_keluar"
) stats
WHERE bk."id_keluar" = stats."id_keluar"
  AND bk."tanggal_keluar" > stats.first_kembali;
