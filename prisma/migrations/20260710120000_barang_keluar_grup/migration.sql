-- AlterTable
ALTER TABLE "BarangKeluar" ADD COLUMN "id_grup" TEXT;

-- CreateIndex
CREATE INDEX "BarangKeluar_id_grup_idx" ON "BarangKeluar"("id_grup");
