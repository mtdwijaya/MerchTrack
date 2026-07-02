import { jsonOk, requireUser, route } from "@/lib/api";
import { getDashboardData } from "@/lib/dashboard";

// GET /api/dashboard — statistik ringkas + top merchandise + distribusi stasiun
export const GET = route(async (req) => {
  requireUser(req);
  const data = await getDashboardData();
  return jsonOk(data);
});
