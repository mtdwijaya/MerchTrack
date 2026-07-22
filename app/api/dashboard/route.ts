import { jsonOk, requireUser, route } from "@/lib/api";
import { clampDashboardPeriod } from "@/lib/dashboard-constants";
import { getDashboardData } from "@/lib/dashboard";

// GET /api/dashboard?chartTahun=2026&sankeyBulan=7&sankeyTahun=2026
// Tanpa sankey* = sankey all-time. chartTahun default tahun berjalan.
export const GET = route(async (req) => {
  requireUser(req);
  const { searchParams } = new URL(req.url);
  const now = new Date();
  const chartYearRaw = Number(
    searchParams.get("chartTahun") ?? now.getFullYear()
  );
  const { year: chartYear } = clampDashboardPeriod(1, chartYearRaw);

  const sankeyBulanParam = searchParams.get("sankeyBulan");
  const sankeyTahunParam = searchParams.get("sankeyTahun");
  const sankeyMonth = sankeyBulanParam ? Number(sankeyBulanParam) : null;
  const sankeyYear = sankeyTahunParam ? Number(sankeyTahunParam) : null;

  const data = await getDashboardData({
    chartYear,
    sankeyMonth,
    sankeyYear,
  });
  return jsonOk(data);
});
