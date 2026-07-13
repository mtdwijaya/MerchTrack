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
  deleteTujuan,
  getTujuanById,
  revalidateTujuanCache,
  updateTujuan,
} from "@/lib/tujuan";
import { tujuanSchema } from "@/lib/validations";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/tujuan/:id
export const GET = route<Ctx>(async (req, ctx) => {
  requireUser(req);
  const id = await parseIdParam(ctx);
  const data = await getTujuanById(id);
  if (!data) throw new ApiError("Tujuan tidak ditemukan", 404);
  return jsonOk(data);
});

// PUT /api/tujuan/:id (ADMIN)
export const PUT = route<Ctx>(async (req, ctx) => {
  await requireAdmin(req);
  const id = await parseIdParam(ctx);
  const data = await parseJson(req, tujuanSchema);

  const updated = await updateTujuan(id, {
    nama_tujuan: data.nama_tujuan,
    jenis_detail: data.jenis_detail,
    label_detail: data.label_detail || null,
    boleh_return: data.boleh_return,
  });

  revalidateTujuanCache();
  revalidateAnalyticsPages();
  return jsonOk(updated);
});

// DELETE /api/tujuan/:id (ADMIN)
export const DELETE = route<Ctx>(async (req, ctx) => {
  await requireAdmin(req);
  const id = await parseIdParam(ctx);
  await deleteTujuan(id);

  revalidateTujuanCache();
  revalidateAnalyticsPages();
  return jsonOk({ message: "Tujuan berhasil dihapus" });
});
