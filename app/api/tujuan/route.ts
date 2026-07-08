import { jsonOk, requireUser, route } from "@/lib/api";
import { getAllTujuan } from "@/lib/tujuan";

// GET /api/tujuan — daftar tujuan (untuk dropdown barang keluar)
export const GET = route(async (req) => {
  requireUser(req);
  const data = await getAllTujuan();
  return jsonOk(data);
});
