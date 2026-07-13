import { getQuery, jsonOk, requireUser, route } from "@/lib/api";
import { getActivityPaginated } from "@/lib/recent-activity";

// GET /api/monitoring/aktivitas?page=&limit=
export const GET = route(async (req) => {
  const user = requireUser(req);
  const q = getQuery(req);

  const activity = await getActivityPaginated(
    {
      id_user: user.id_user,
      id_stasiun: user.id_stasiun,
      role: user.role,
    },
    q.num("page", 1),
    q.num("limit", 10)
  );

  return jsonOk(activity);
});
