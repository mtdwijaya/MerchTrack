import { jsonOk, requireUser, route } from "@/lib/api";
import { getAllKategori } from "@/lib/kategori";

// GET /api/kategori — daftar kategori penggunaan (untuk dropdown barang keluar)
export const GET = route(async (req) => {
  requireUser(req);
  const data = await getAllKategori();
  return jsonOk(data);
});
