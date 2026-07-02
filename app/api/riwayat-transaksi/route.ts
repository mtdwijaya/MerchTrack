import { getQuery, jsonOk, requireUser, route } from "@/lib/api";
import {
  getRiwayatTransaksiPaginated,
  getRiwayatTransaksiSummary,
  parseRiwayatSort,
} from "@/lib/riwayat-transaksi";
import { parseSortValue } from "@/lib/sort";

// GET /api/riwayat-transaksi?page=&limit=&search=&sort=tanggal_keluar:desc&id_kategori=&tanggal=YYYY-MM-DD
export const GET = route(async (req) => {
  requireUser(req);
  const q = getQuery(req);
  const { sortBy, sortOrder } = parseSortValue(
    q.str("sort", "tanggal_keluar:desc"),
    "tanggal_keluar",
    "desc"
  );
  const parsed = parseRiwayatSort(sortBy, sortOrder);

  const [list, summary] = await Promise.all([
    getRiwayatTransaksiPaginated({
      page: q.num("page", 1),
      limit: q.num("limit", 10),
      search: q.str("search") || undefined,
      sortBy: parsed.sortBy,
      sortOrder: parsed.sortOrder,
      idKategori: q.optionalNum("id_kategori"),
      tanggal: q.str("tanggal") || undefined,
    }),
    getRiwayatTransaksiSummary(),
  ]);

  return jsonOk({ ...list, summary });
});
