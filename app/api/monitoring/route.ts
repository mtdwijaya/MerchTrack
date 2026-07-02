import { getQuery, jsonOk, requireUser, route } from "@/lib/api";
import {
  getMonitoringPaginated,
  getMonitoringSummary,
  parseMonitoringSort,
  type StockStatus,
} from "@/lib/monitoring";
import { parseSortValue } from "@/lib/sort";

const STATUS_VALUES: StockStatus[] = ["habis", "rendah", "normal"];

// GET /api/monitoring?page=&limit=&search=&sort=jumlah_stok:asc&status=rendah
export const GET = route(async (req) => {
  requireUser(req);
  const q = getQuery(req);
  const { sortBy, sortOrder } = parseSortValue(
    q.str("sort", "jumlah_stok:asc"),
    "jumlah_stok",
    "asc"
  );
  const parsed = parseMonitoringSort(sortBy, sortOrder);

  const statusRaw = q.str("status") as StockStatus;
  const status = STATUS_VALUES.includes(statusRaw) ? statusRaw : undefined;

  const [list, summary] = await Promise.all([
    getMonitoringPaginated({
      page: q.num("page", 1),
      limit: q.num("limit", 10),
      search: q.str("search") || undefined,
      sortBy: parsed.sortBy,
      sortOrder: parsed.sortOrder,
      status,
    }),
    getMonitoringSummary(),
  ]);

  return jsonOk({ ...list, summary });
});
