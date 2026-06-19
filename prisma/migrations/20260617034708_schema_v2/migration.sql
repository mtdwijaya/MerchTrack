/*
  Warnings:

  - You are about to drop the `barang_keluar` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `barang_masuk` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `kategori_penggunaan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `merchandise` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `stasiun` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `stok` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "barang_keluar" DROP CONSTRAINT "barang_keluar_id_kategori_fkey";

-- DropForeignKey
ALTER TABLE "barang_keluar" DROP CONSTRAINT "barang_keluar_id_merch_fkey";

-- DropForeignKey
ALTER TABLE "barang_keluar" DROP CONSTRAINT "barang_keluar_id_stasiun_fkey";
-- DropForeignKey
ALTER TABLE "barang_keluar" DROP CONSTRAINT "barang_keluar_id_user_fkey";

-- DropForeignKey
ALTER TABLE "barang_masuk" DROP CONSTRAINT "barang_masuk_id_merch_fkey";

-- DropForeignKey
ALTER TABLE "barang_masuk" DROP CONSTRAINT "barang_masuk_id_user_fkey";

-- DropForeignKey
ALTER TABLE "stok" DROP CONSTRAINT "stok_id_merch_fkey";

-- DropForeignKey
ALTER TABLE "user" DROP CONSTRAINT "user_id_stasiun_fkey";

-- DropTable
DROP TABLE "barang_keluar";

-- DropTable
DROP TABLE "barang_masuk";

-- DropTable
DROP TABLE "kategori_penggunaan";

-- DropTable
DROP TABLE "merchandise";

-- DropTable
DROP TABLE "stasiun";

-- DropTable
DROP TABLE "stok";

-- DropTable
DROP TABLE "user";

-- CreateTable
CREATE TABLE "User" (
    "id_user" SERIAL NOT NULL,
    "id_stasiun" INTEGER,
    "nama_user" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PETUGAS',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id_user")
);

-- CreateTable
CREATE TABLE "Stasiun" (
    "id_stasiun" SERIAL NOT NULL,
    "kode_stasiun" TEXT NOT NULL,
    "nama_stasiun" TEXT NOT NULL,
    "alamat" TEXT,
    "kontak" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stasiun_pkey" PRIMARY KEY ("id_stasiun")
);

-- CreateTable
CREATE TABLE "Merchandise" (
    "id_merch" SERIAL NOT NULL,
    "nama_merch" TEXT NOT NULL,
    "deskripsi" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Merchandise_pkey" PRIMARY KEY ("id_merch")
);

-- CreateTable
CREATE TABLE "Stok" (
    "id_stok" SERIAL NOT NULL,
    "id_merch" INTEGER NOT NULL,
    "jumlah_stok" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Stok_pkey" PRIMARY KEY ("id_stok")
);

-- CreateTable
CREATE TABLE "KategoriPenggunaan" (
    "id_kategori" SERIAL NOT NULL,
    "nama_kategori" TEXT NOT NULL,

    CONSTRAINT "KategoriPenggunaan_pkey" PRIMARY KEY ("id_kategori")
);

-- CreateTable
CREATE TABLE "BarangMasuk" (
    "id_masuk" SERIAL NOT NULL,
    "id_merch" INTEGER NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "tanggal_masuk" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "keterangan" TEXT,
    "id_user" INTEGER NOT NULL,

    CONSTRAINT "BarangMasuk_pkey" PRIMARY KEY ("id_masuk")
);

-- CreateTable
CREATE TABLE "BarangKeluar" (
    "id_keluar" SERIAL NOT NULL,
    "id_merch" INTEGER NOT NULL,
    "id_stasiun" INTEGER NOT NULL,
    "id_kategori" INTEGER NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "tanggal_keluar" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "keterangan" TEXT,
    "id_user" INTEGER NOT NULL,

    CONSTRAINT "BarangKeluar_pkey" PRIMARY KEY ("id_keluar")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Stasiun_kode_stasiun_key" ON "Stasiun"("kode_stasiun");

-- CreateIndex
CREATE UNIQUE INDEX "Stok_id_merch_key" ON "Stok"("id_merch");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_id_stasiun_fkey" FOREIGN KEY ("id_stasiun") REFERENCES "Stasiun"("id_stasiun") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stok" ADD CONSTRAINT "Stok_id_merch_fkey" FOREIGN KEY ("id_merch") REFERENCES "Merchandise"("id_merch") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarangMasuk" ADD CONSTRAINT "BarangMasuk_id_merch_fkey" FOREIGN KEY ("id_merch") REFERENCES "Merchandise"("id_merch") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarangMasuk" ADD CONSTRAINT "BarangMasuk_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "User"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarangKeluar" ADD CONSTRAINT "BarangKeluar_id_merch_fkey" FOREIGN KEY ("id_merch") REFERENCES "Merchandise"("id_merch") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarangKeluar" ADD CONSTRAINT "BarangKeluar_id_stasiun_fkey" FOREIGN KEY ("id_stasiun") REFERENCES "Stasiun"("id_stasiun") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarangKeluar" ADD CONSTRAINT "BarangKeluar_id_kategori_fkey" FOREIGN KEY ("id_kategori") REFERENCES "KategoriPenggunaan"("id_kategori") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarangKeluar" ADD CONSTRAINT "BarangKeluar_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "User"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;
