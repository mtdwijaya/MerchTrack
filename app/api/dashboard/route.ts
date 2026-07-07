import { jsonOk, requireUser, route } from "@/lib/api";
import { clampDashboardPeriod } from "@/lib/dashboard-constants";
import { getDashboardData } from "@/lib/dashboard";

// GET /api/dashboard?bulan=7&tahun=2026
export const GET = route(async (req) => {
  requireUser(req);
  const { searchParams } = new URL(req.url);
  const now = new Date();
  const month = Number(searchParams.get("bulan") ?? now.getMonth() + 1);
  const year = Number(searchParams.get("tahun") ?? now.getFullYear());
  const { month: safeMonth, year: safeYear } = clampDashboardPeriod(month, year);
  const data = await getDashboardData(safeMonth, safeYear);
  return jsonOk(data);
});
