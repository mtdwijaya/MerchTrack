-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'PETUGAS');

-- CreateTable
CREATE TABLE "public"."user" (
    "id_user" SERIAL NOT NULL,
    "id_stasiun" INTEGER NOT NULL,
    "nama_user" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" "public"."Role" NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id_user")
);

-- CreateTable
CREATE TABLE "public"."stasiun" (
    "id_stasiun" SERIAL NOT NULL,
    "kode_stasiun" VARCHAR(20) NOT NULL,
    "nama_stasiun" VARCHAR(100) NOT NULL,
    "kontak" VARCHAR(50) NOT NULL,

    CONSTRAINT "stasiun_pkey" PRIMARY KEY ("id_stasiun")
);

-- CreateTable
CREATE TABLE "public"."merchandise" (
    "id_merch" SERIAL NOT NULL,
    "nama_merch" VARCHAR(100) NOT NULL,
    "deskripsi" VARCHAR(255),

    CONSTRAINT "merchandise_pkey" PRIMARY KEY ("id_merch")
);

-- CreateTable
CREATE TABLE "public"."stok" (
    "id_stok" SERIAL NOT NULL,
    "id_merch" INTEGER NOT NULL,
    "jumlah_stok" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "stok_pkey" PRIMARY KEY ("id_stok")
);

-- CreateTable
CREATE TABLE "public"."kategori_penggunaan" (
    "id_kategori" SERIAL NOT NULL,
    "nama_kategori" VARCHAR(100) NOT NULL,

    CONSTRAINT "kategori_penggunaan_pkey" PRIMARY KEY ("id_kategori")
);

-- CreateTable
CREATE TABLE "public"."barang_masuk" (
    "id_masuk" SERIAL NOT NULL,
    "id_merch" INTEGER NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "tanggal_masuk" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_user" INTEGER NOT NULL,
    "keterangan" VARCHAR(255),

    CONSTRAINT "barang_masuk_pkey" PRIMARY KEY ("id_masuk")
);

-- CreateTable
CREATE TABLE "public"."barang_keluar" (
    "id_keluar" SERIAL NOT NULL,
    "id_merch" INTEGER NOT NULL,
    "id_stasiun" INTEGER NOT NULL,
    "id_kategori" INTEGER NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "tanggal_keluar" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "keterangan" VARCHAR(255),
    "id_user" INTEGER NOT NULL,

    CONSTRAINT "barang_keluar_pkey" PRIMARY KEY ("id_keluar")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "public"."user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "stasiun_kode_stasiun_key" ON "public"."stasiun"("kode_stasiun");

-- AddForeignKey
ALTER TABLE "public"."user" ADD CONSTRAINT "user_id_stasiun_fkey" FOREIGN KEY ("id_stasiun") REFERENCES "public"."stasiun"("id_stasiun") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stok" ADD CONSTRAINT "stok_id_merch_fkey" FOREIGN KEY ("id_merch") REFERENCES "public"."merchandise"("id_merch") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."barang_masuk" ADD CONSTRAINT "barang_masuk_id_merch_fkey" FOREIGN KEY ("id_merch") REFERENCES "public"."merchandise"("id_merch") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."barang_masuk" ADD CONSTRAINT "barang_masuk_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "public"."user"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."barang_keluar" ADD CONSTRAINT "barang_keluar_id_merch_fkey" FOREIGN KEY ("id_merch") REFERENCES "public"."merchandise"("id_merch") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."barang_keluar" ADD CONSTRAINT "barang_keluar_id_stasiun_fkey" FOREIGN KEY ("id_stasiun") REFERENCES "public"."stasiun"("id_stasiun") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."barang_keluar" ADD CONSTRAINT "barang_keluar_id_kategori_fkey" FOREIGN KEY ("id_kategori") REFERENCES "public"."kategori_penggunaan"("id_kategori") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."barang_keluar" ADD CONSTRAINT "barang_keluar_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "public"."user"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;
