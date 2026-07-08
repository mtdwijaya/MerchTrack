-- Backfill timestamp edit di awal pesan agar waktu aktivitas edit konsisten
UPDATE "AktivitasLog"
SET "pesan" = '@' || to_char("created_at" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') || '@' || "pesan"
WHERE "jenis" = 'EDIT'
  AND "pesan" NOT LIKE '@%@%';
