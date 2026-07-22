import { getQuery, jsonOk, requireUser, route } from "@/lib/api";
import {
  getRiwayatUnifiedPaginated,
  type RiwayatJenis,
} from "@/lib/riwayat-transaksi";

const JENIS_VALUES: RiwayatJenis[] = ["KELUAR", "MASUK", "RESTOCK"];

function parseIdMerch(value: string): number | undefined {
  if (!value) return undefined;
  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : undefined;
}

// GET /api/riwayat-transaksi?page=&limit=&search=&jenis=KELUAR|MASUK|RESTOCK&id_merch=&tanggal_dari=&tanggal_sampai=
// Unified masuk + keluar + restock (sama seperti UI riwayat transaksi)
export const GET = route(async (req) => {
  requireUser(req);
  const q = getQuery(req);

  const jenisRaw = q.str("jenis").toUpperCase() as RiwayatJenis;
  const jenis = JENIS_VALUES.includes(jenisRaw) ? jenisRaw : undefined;

  const list = await getRiwayatUnifiedPaginated({
    page: q.num("page", 1),
    limit: q.num("limit", 10),
    search: q.str("search") || undefined,
    jenis,
    idMerch: parseIdMerch(q.str("id_merch")),
    tanggalDari: q.str("tanggal_dari") || undefined,
    tanggalSampai: q.str("tanggal_sampai") || undefined,
  });

  return jsonOk(list);
});
