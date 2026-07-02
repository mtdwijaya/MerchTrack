import {
  ApiError,
  jsonOk,
  parseIdParam,
  parseJson,
  requireAdmin,
  requireUser,
  route,
} from "@/lib/api";
import {
  deleteMerchandise,
  getMerchandiseById,
  revalidateMerchandiseListCache,
  updateMerchandise,
} from "@/lib/merchandise";
import { revalidateAnalyticsPages } from "@/lib/revalidate-analytics";
import { merchandiseUpdateSchema } from "@/lib/validations";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/merchandise/:id — detail satu merchandise
export const GET = route<Ctx>(async (req, ctx) => {
  requireUser(req);
  const id = await parseIdParam(ctx);
  const data = await getMerchandiseById(id);
  if (!data) throw new ApiError("Merchandise tidak ditemukan", 404);
  return jsonOk(data);
});

// PUT /api/merchandise/:id — ubah nama/deskripsi (ADMIN). Stok lewat endpoint restock.
export const PUT = route<Ctx>(async (req, ctx) => {
  await requireAdmin(req);
  const id = await parseIdParam(ctx);
  const data = await parseJson(req, merchandiseUpdateSchema);

  const updated = await updateMerchandise(id, {
    nama_merch: data.nama_merch,
    deskripsi: data.deskripsi || undefined,
  });

  revalidateMerchandiseListCache();
  revalidateAnalyticsPages();
  return jsonOk(updated);
});

// DELETE /api/merchandise/:id (ADMIN)
export const DELETE = route<Ctx>(async (req, ctx) => {
  await requireAdmin(req);
  const id = await parseIdParam(ctx);
  await deleteMerchandise(id);

  revalidateMerchandiseListCache();
  revalidateAnalyticsPages();
  return jsonOk({ message: "Merchandise berhasil dihapus" });
});
