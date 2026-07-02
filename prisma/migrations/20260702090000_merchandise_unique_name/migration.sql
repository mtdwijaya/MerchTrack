-- Tambah kolom ternormalisasi untuk mencegah duplikat nama merchandise.

-- 1. Tambah kolom (sementara nullable agar bisa di-backfill).
ALTER TABLE "Merchandise" ADD COLUMN "nama_normalized" TEXT;

-- 2. Backfill: lowercase, trim, dan rapikan spasi ganda.
UPDATE "Merchandise"
SET "nama_normalized" = lower(btrim(regexp_replace("nama_merch", '\s+', ' ', 'g')));

-- 3. Dedupe data lama: baris duplikat (id lebih besar) diberi suffix agar
--    unique index bisa dibuat tanpa gagal. Nama tampilan tidak berubah.
UPDATE "Merchandise" m
SET "nama_normalized" = m."nama_normalized" || '#dup' || m."id_merch"
WHERE EXISTS (
  SELECT 1
  FROM "Merchandise" x
  WHERE x."nama_normalized" = m."nama_normalized"
    AND x."id_merch" < m."id_merch"
);

-- 4. Jadikan wajib + unik.
ALTER TABLE "Merchandise" ALTER COLUMN "nama_normalized" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Merchandise_nama_normalized_key" ON "Merchandise"("nama_normalized");
