import { getQuery, jsonOk, requireUser, route } from "@/lib/api";
import {
  getRiwayatUnifiedPaginated,
  getRiwayatUnifiedSummary,
  type RiwayatJenis,
} from "@/lib/riwayat-transaksi";

const JENIS_VALUES: RiwayatJenis[] = ["KELUAR", "MASUK"];

// GET /api/riwayat-transaksi?page=&limit=&search=&jenis=KELUAR|MASUK&tanggal=YYYY-MM-DD
// Unified masuk + keluar (sama seperti UI riwayat transaksi)
export const GET = route(async (req) => {
  requireUser(req);
  const q = getQuery(req);

  const jenisRaw = q.str("jenis").toUpperCase() as RiwayatJenis;
  const jenis = JENIS_VALUES.includes(jenisRaw) ? jenisRaw : undefined;

  const [list, summary] = await Promise.all([
    getRiwayatUnifiedPaginated({
      page: q.num("page", 1),
      limit: q.num("limit", 10),
      search: q.str("search") || undefined,
      jenis,
      tanggal: q.str("tanggal") || undefined,
    }),
    getRiwayatUnifiedSummary(),
  ]);

  return jsonOk({ ...list, summary });
});
