import {
  getQuery,
  jsonOk,
  parseJson,
  requireAdmin,
  requireUser,
  route,
} from "@/lib/api";
import {
  createMerchandise,
  getMerchandisePaginated,
  getMerchandiseSummary,
  parseMerchandiseSort,
  revalidateMerchandiseListCache,
} from "@/lib/merchandise";
import { revalidateAnalyticsPages } from "@/lib/revalidate-analytics";
import { parseSortValue } from "@/lib/sort";
import { merchandiseCreateSchema } from "@/lib/validations";

// GET /api/merchandise?page=&limit=&search=&sort=nama_merch:asc
export const GET = route(async (req) => {
  requireUser(req);
  const q = getQuery(req);
  const { sortBy, sortOrder } = parseSortValue(
    q.str("sort", "nama_merch:asc"),
    "nama_merch",
    "asc"
  );
  const parsed = parseMerchandiseSort(sortBy, sortOrder);

  const [list, summary] = await Promise.all([
    getMerchandisePaginated({
      page: q.num("page", 1),
      limit: q.num("limit", 10),
      search: q.str("search") || undefined,
      sortBy: parsed.sortBy,
      sortOrder: parsed.sortOrder,
    }),
    getMerchandiseSummary(),
  ]);

  return jsonOk({ ...list, summary });
});

// POST /api/merchandise — buat merchandise baru (ADMIN)
export const POST = route(async (req) => {
  const admin = await requireAdmin(req);
  const data = await parseJson(req, merchandiseCreateSchema);

  const created = await createMerchandise(
    {
      nama_merch: data.nama_merch,
      deskripsi: data.deskripsi || undefined,
      jumlah_stok: data.jumlah_stok,
    },
    admin.id_user
  );

  revalidateMerchandiseListCache();
  revalidateAnalyticsPages();
  return jsonOk(created, 201);
});
