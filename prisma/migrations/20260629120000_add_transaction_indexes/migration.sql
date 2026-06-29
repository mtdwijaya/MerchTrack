-- CreateIndex
CREATE INDEX "BarangMasuk_tanggal_masuk_idx" ON "BarangMasuk"("tanggal_masuk");

-- CreateIndex
CREATE INDEX "BarangMasuk_id_merch_idx" ON "BarangMasuk"("id_merch");

-- CreateIndex
CREATE INDEX "BarangKeluar_tanggal_keluar_idx" ON "BarangKeluar"("tanggal_keluar");

-- CreateIndex
CREATE INDEX "BarangKeluar_id_merch_idx" ON "BarangKeluar"("id_merch");

-- CreateIndex
CREATE INDEX "BarangKeluar_id_stasiun_idx" ON "BarangKeluar"("id_stasiun");

-- CreateIndex
CREATE INDEX "BarangKeluar_id_kategori_idx" ON "BarangKeluar"("id_kategori");
