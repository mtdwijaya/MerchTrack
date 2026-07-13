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
  deleteUnit,
  getUnitById,
  revalidateUnitCache,
  updateUnit,
} from "@/lib/unit";
import { unitSchema } from "@/lib/validations";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/unit/:id
export const GET = route<Ctx>(async (req, ctx) => {
  requireUser(req);
  const id = await parseIdParam(ctx);
  const data = await getUnitById(id);
  if (!data) throw new ApiError("Unit tidak ditemukan", 404);
  return jsonOk(data);
});

// PUT /api/unit/:id (ADMIN)
export const PUT = route<Ctx>(async (req, ctx) => {
  await requireAdmin(req);
  const id = await parseIdParam(ctx);
  const data = await parseJson(req, unitSchema);

  const updated = await updateUnit(id, {
    kode_unit: data.kode_unit,
    nama_unit: data.nama_unit,
  });

  revalidateUnitCache();
  revalidateAnalyticsPages();
  return jsonOk(updated);
});

// DELETE /api/unit/:id (ADMIN)
export const DELETE = route<Ctx>(async (req, ctx) => {
  await requireAdmin(req);
  const id = await parseIdParam(ctx);
  await deleteUnit(id);

  revalidateUnitCache();
  revalidateAnalyticsPages();
  return jsonOk({ message: "Unit berhasil dihapus" });
});
