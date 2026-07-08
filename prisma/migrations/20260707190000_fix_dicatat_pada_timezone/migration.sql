-- Perbaiki dicatat_pada yang tersimpan +7 jam akibat $executeRaw (offset WIB).
UPDATE "BarangKeluar"
SET "dicatat_pada" = "tanggal_keluar"
WHERE ABS(EXTRACT(EPOCH FROM ("dicatat_pada" - "tanggal_keluar")) - 25200) < 120;
