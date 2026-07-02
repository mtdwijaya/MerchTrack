import {
  ApiError,
  jsonOk,
  parseIdParam,
  parseJson,
  requireAdmin,
  requireUser,
  route,
} from "@/lib/api";
import { revalidateAnalyticsPages } from "@/lib/revalidate-analytics";
import {
  deleteStasiun,
  getStasiunById,
  revalidateStasiunCache,
  updateStasiun,
} from "@/lib/stasiun";
import { stasiunSchema } from "@/lib/validations";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/stasiun/:id
export const GET = route<Ctx>(async (req, ctx) => {
  requireUser(req);
  const id = await parseIdParam(ctx);
  const data = await getStasiunById(id);
  if (!data) throw new ApiError("Stasiun tidak ditemukan", 404);
  return jsonOk(data);
});

// PUT /api/stasiun/:id (ADMIN)
export const PUT = route<Ctx>(async (req, ctx) => {
  await requireAdmin(req);
  const id = await parseIdParam(ctx);
  const data = await parseJson(req, stasiunSchema);

  const updated = await updateStasiun(id, {
    kode_stasiun: data.kode_stasiun,
    nama_stasiun: data.nama_stasiun,
    alamat: data.alamat || undefined,
    kontak: data.kontak || undefined,
  });

  revalidateStasiunCache();
  revalidateAnalyticsPages();
  return jsonOk(updated);
});

// DELETE /api/stasiun/:id (ADMIN)
export const DELETE = route<Ctx>(async (req, ctx) => {
  await requireAdmin(req);
  const id = await parseIdParam(ctx);
  await deleteStasiun(id);

  revalidateStasiunCache();
  revalidateAnalyticsPages();
  return jsonOk({ message: "Stasiun berhasil dihapus" });
});
