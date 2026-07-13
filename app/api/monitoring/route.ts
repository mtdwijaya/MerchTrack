import { jsonOk, requireUser, route } from "@/lib/api";
import { getMonitoringOverview } from "@/lib/monitoring-overview";

// GET /api/monitoring — overview monitoring (sama ringkasan UI)
export const GET = route(async (req) => {
  const user = requireUser(req);
  const data = await getMonitoringOverview({
    id_user: user.id_user,
    id_stasiun: user.id_stasiun,
    role: user.role,
  });
  return jsonOk(data);
});
