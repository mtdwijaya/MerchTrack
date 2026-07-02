import {
  getQuery,
  jsonOk,
  parseJson,
  requireAdmin,
  requireUser,
  route,
} from "@/lib/api";
import { revalidateAnalyticsPages } from "@/lib/revalidate-analytics";
import { parseSortValue } from "@/lib/sort";
import {
  createStasiun,
  getStasiunPaginated,
  getStasiunSummary,
  parseStasiunSort,
  revalidateStasiunCache,
} from "@/lib/stasiun";
import { stasiunSchema } from "@/lib/validations";

// GET /api/stasiun?page=&limit=&search=&sort=nama_stasiun:asc
export const GET = route(async (req) => {
  requireUser(req);
  const q = getQuery(req);
  const { sortBy, sortOrder } = parseSortValue(
    q.str("sort", "nama_stasiun:asc"),
    "nama_stasiun",
    "asc"
  );
  const parsed = parseStasiunSort(sortBy, sortOrder);

  const [list, summary] = await Promise.all([
    getStasiunPaginated({
      page: q.num("page", 1),
      limit: q.num("limit", 10),
      search: q.str("search") || undefined,
      sortBy: parsed.sortBy,
      sortOrder: parsed.sortOrder,
    }),
    getStasiunSummary(),
  ]);

  return jsonOk({ ...list, summary });
});

// POST /api/stasiun — tambah stasiun (ADMIN)
export const POST = route(async (req) => {
  await requireAdmin(req);
  const data = await parseJson(req, stasiunSchema);

  const created = await createStasiun({
    kode_stasiun: data.kode_stasiun,
    nama_stasiun: data.nama_stasiun,
    alamat: data.alamat || undefined,
    kontak: data.kontak || undefined,
  });

  revalidateStasiunCache();
  revalidateAnalyticsPages();
  return jsonOk(created, 201);
});
