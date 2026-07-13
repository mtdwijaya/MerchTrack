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
  createUnit,
  getAllUnit,
  getUnitPaginated,
  getUnitSummary,
  parseUnitSort,
  revalidateUnitCache,
} from "@/lib/unit";
import { unitSchema } from "@/lib/validations";

// GET /api/unit
// - tanpa page → semua (dropdown)
// - dengan page → list paginated + summary
export const GET = route(async (req) => {
  requireUser(req);
  const q = getQuery(req);
  const pageRaw = q.str("page");

  if (!pageRaw) {
    const data = await getAllUnit();
    return jsonOk(data);
  }

  const { sortBy, sortOrder } = parseSortValue(
    q.str("sort", "nama_unit:asc"),
    "nama_unit",
    "asc"
  );
  const parsed = parseUnitSort(sortBy, sortOrder);

  const [list, summary] = await Promise.all([
    getUnitPaginated({
      page: q.num("page", 1),
      limit: q.num("limit", 10),
      search: q.str("search") || undefined,
      sortBy: parsed.sortBy,
      sortOrder: parsed.sortOrder,
    }),
    getUnitSummary(),
  ]);

  return jsonOk({ ...list, summary });
});

// POST /api/unit — tambah unit (ADMIN)
export const POST = route(async (req) => {
  await requireAdmin(req);
  const data = await parseJson(req, unitSchema);

  const created = await createUnit({
    kode_unit: data.kode_unit,
    nama_unit: data.nama_unit,
  });

  revalidateUnitCache();
  revalidateAnalyticsPages();
  return jsonOk(created, 201);
});
