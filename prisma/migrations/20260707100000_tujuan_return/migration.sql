-- CreateEnum
CREATE TYPE "JenisDetailTujuan" AS ENUM ('STASIUN', 'UNIT', 'TEKS', 'TIDAK_ADA');
CREATE TYPE "StatusBarangKeluar" AS ENUM ('AKTIF', 'SEBAGIAN_KEMBALI', 'LUNAS_KEMBALI');

-- Rename KategoriPenggunaan -> Tujuan
ALTER TABLE "KategoriPenggunaan" RENAME TO "Tujuan";
ALTER TABLE "Tujuan" RENAME COLUMN "id_kategori" TO "id_tujuan";
ALTER TABLE "Tujuan" RENAME COLUMN "nama_kategori" TO "nama_tujuan";

-- Add tujuan config columns
ALTER TABLE "Tujuan" ADD COLUMN "jenis_detail" "JenisDetailTujuan" NOT NULL DEFAULT 'TEKS';
ALTER TABLE "Tujuan" ADD COLUMN "label_detail" TEXT;
ALTER TABLE "Tujuan" ADD COLUMN "boleh_return" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS "Tujuan_nama_tujuan_key" ON "Tujuan"("nama_tujuan");

-- Create unit table
CREATE TABLE "Unit" (
    "id_unit" SERIAL NOT NULL,
    "kode_unit" TEXT NOT NULL,
    "nama_unit" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id_unit")
);

CREATE UNIQUE INDEX "Unit_kode_unit_key" ON "Unit"("kode_unit");

-- Update BarangKeluar
ALTER TABLE "BarangKeluar" RENAME COLUMN "id_kategori" TO "id_tujuan";
ALTER TABLE "BarangKeluar" ALTER COLUMN "id_stasiun" DROP NOT NULL;
ALTER TABLE "BarangKeluar" ADD COLUMN "id_unit" INTEGER;
ALTER TABLE "BarangKeluar" ADD COLUMN "detail_teks" TEXT;
ALTER TABLE "BarangKeluar" ADD COLUMN "jumlah_kembali" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "BarangKeluar" ADD COLUMN "status" "StatusBarangKeluar" NOT NULL DEFAULT 'AKTIF';

ALTER TABLE "BarangKeluar" RENAME CONSTRAINT "BarangKeluar_id_kategori_fkey" TO "BarangKeluar_id_tujuan_fkey";

ALTER TABLE "BarangKeluar" ADD CONSTRAINT "BarangKeluar_id_unit_fkey" FOREIGN KEY ("id_unit") REFERENCES "Unit"("id_unit") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "BarangKeluar_id_tujuan_idx" ON "BarangKeluar"("id_tujuan");
CREATE INDEX IF NOT EXISTS "BarangKeluar_status_idx" ON "BarangKeluar"("status");

-- Create BarangKembali table
CREATE TABLE "BarangKembali" (
    "id_kembali" SERIAL NOT NULL,
    "id_keluar" INTEGER NOT NULL,
    "id_user" INTEGER NOT NULL,
    "jumlah_kembali" INTEGER NOT NULL,
    "tanggal_kembali" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "keterangan" TEXT,

    CONSTRAINT "BarangKembali_pkey" PRIMARY KEY ("id_kembali")
);

ALTER TABLE "BarangKembali" ADD CONSTRAINT "BarangKembali_id_keluar_fkey" FOREIGN KEY ("id_keluar") REFERENCES "BarangKeluar"("id_keluar") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BarangKembali" ADD CONSTRAINT "BarangKembali_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "User"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "BarangKembali_id_keluar_idx" ON "BarangKembali"("id_keluar");
CREATE INDEX "BarangKembali_tanggal_kembali_idx" ON "BarangKembali"("tanggal_kembali");

-- Seed tujuan config from existing categories
UPDATE "Tujuan" SET "jenis_detail" = 'TEKS', "label_detail" = 'Nama Keterangan Event', "boleh_return" = true WHERE "nama_tujuan" = 'Event';
UPDATE "Tujuan" SET "jenis_detail" = 'UNIT', "label_detail" = 'Pilih Unit', "boleh_return" = false WHERE "nama_tujuan" = 'Dibagikan ke Unit Lain';
UPDATE "Tujuan" SET "jenis_detail" = 'TIDAK_ADA', "boleh_return" = false WHERE "nama_tujuan" = 'Dibagikan ke Penumpang';
UPDATE "Tujuan" SET "jenis_detail" = 'TEKS', "label_detail" = 'Keterangan', "boleh_return" = true WHERE "nama_tujuan" = 'Lainnya';

INSERT INTO "Tujuan" ("nama_tujuan", "jenis_detail", "label_detail", "boleh_return")
VALUES ('Stasiun', 'STASIUN', 'Pilih Stasiun', false)
ON CONFLICT ("nama_tujuan") DO NOTHING;

-- Seed default units
INSERT INTO "Unit" ("kode_unit", "nama_unit", "updated_at") VALUES
  ('UNT-001', 'Unit Operasional', CURRENT_TIMESTAMP),
  ('UNT-002', 'Unit Pemasaran', CURRENT_TIMESTAMP),
  ('UNT-003', 'Unit Humas', CURRENT_TIMESTAMP),
  ('UNT-004', 'Unit IT', CURRENT_TIMESTAMP)
ON CONFLICT ("kode_unit") DO NOTHING;
