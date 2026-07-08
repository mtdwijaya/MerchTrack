-- CreateEnum
CREATE TYPE "JenisAktivitas" AS ENUM ('EDIT');

-- CreateTable
CREATE TABLE "AktivitasLog" (
    "id_aktivitas" SERIAL NOT NULL,
    "jenis" "JenisAktivitas" NOT NULL,
    "id_user" INTEGER NOT NULL,
    "pesan" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AktivitasLog_pkey" PRIMARY KEY ("id_aktivitas")
);

-- CreateIndex
CREATE INDEX "AktivitasLog_created_at_idx" ON "AktivitasLog"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "AktivitasLog" ADD CONSTRAINT "AktivitasLog_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "User"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;
