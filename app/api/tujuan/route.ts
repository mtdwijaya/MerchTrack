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
  createTujuan,
  getAllTujuan,
  getTujuanPaginated,
  getTujuanSummary,
  parseTujuanSort,
  revalidateTujuanCache,
} from "@/lib/tujuan";
import { tujuanSchema } from "@/lib/validations";
import type { JenisDetailTujuan } from "@prisma/client";

const JENIS_DETAIL: JenisDetailTujuan[] = [
  "STASIUN",
  "UNIT",
  "TEKS",
  "TIDAK_ADA",
];

// GET /api/tujuan
// - tanpa page → semua (dropdown)
// - dengan page → list paginated + summary
export const GET = route(async (req) => {
  requireUser(req);
  const q = getQuery(req);
  const pageRaw = q.str("page");

  if (!pageRaw) {
    const data = await getAllTujuan();
    return jsonOk(data);
  }

  const jenisRaw = q.str("jenis_detail");
  const jenisDetail = JENIS_DETAIL.includes(jenisRaw as JenisDetailTujuan)
    ? (jenisRaw as JenisDetailTujuan)
    : undefined;

  const { sortBy, sortOrder } = parseSortValue(
    q.str("sort", "nama_tujuan:asc"),
    "nama_tujuan",
    "asc"
  );
  const parsed = parseTujuanSort(sortBy, sortOrder);

  const [list, summary] = await Promise.all([
    getTujuanPaginated({
      page: q.num("page", 1),
      limit: q.num("limit", 10),
      search: q.str("search") || undefined,
      sortBy: parsed.sortBy,
      sortOrder: parsed.sortOrder,
      jenisDetail,
    }),
    getTujuanSummary(),
  ]);

  return jsonOk({ ...list, summary });
});

// POST /api/tujuan — tambah tujuan (ADMIN)
export const POST = route(async (req) => {
  await requireAdmin(req);
  const data = await parseJson(req, tujuanSchema);

  const created = await createTujuan({
    nama_tujuan: data.nama_tujuan,
    jenis_detail: data.jenis_detail,
    label_detail: data.label_detail || null,
    boleh_return: data.boleh_return,
  });

  revalidateTujuanCache();
  revalidateAnalyticsPages();
  return jsonOk(created, 201);
});
