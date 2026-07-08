-- AlterTable: waktu dicatat transaksi keluar (tidak berubah saat edit)
ALTER TABLE "BarangKeluar" ADD COLUMN "dicatat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "BarangKeluar" SET "dicatat_pada" = "tanggal_keluar";

CREATE INDEX "BarangKeluar_dicatat_pada_idx" ON "BarangKeluar"("dicatat_pada" DESC);
