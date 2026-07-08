import { jsonOk, requireUser, route } from "@/lib/api";
import { getAllUnit } from "@/lib/unit";

// GET /api/unit — daftar unit (untuk dropdown detail tujuan)
export const GET = route(async (req) => {
  requireUser(req);
  const data = await getAllUnit();
  return jsonOk(data);
});
