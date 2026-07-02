import {
  ApiError,
  jsonOk,
  parseIdParam,
  parseJson,
  requireAdmin,
  route,
} from "@/lib/api";
import {
  deletePengguna,
  getPenggunaById,
  updatePengguna,
} from "@/lib/pengguna";
import { penggunaUpdateSchema } from "@/lib/validations";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/pengguna/:id (ADMIN)
export const GET = route<Ctx>(async (req, ctx) => {
  await requireAdmin(req);
  const id = await parseIdParam(ctx);
  const data = await getPenggunaById(id);
  if (!data) throw new ApiError("Pengguna tidak ditemukan", 404);
  return jsonOk(data);
});

// PUT /api/pengguna/:id (ADMIN). Kosongkan "password" jika tidak ingin mengubahnya.
export const PUT = route<Ctx>(async (req, ctx) => {
  await requireAdmin(req);
  const id = await parseIdParam(ctx);
  const data = await parseJson(req, penggunaUpdateSchema);

  const { password, ...rest } = data;

  const updated = await updatePengguna(id, {
    nama_user: rest.nama_user,
    email: rest.email,
    role: rest.role,
    id_stasiun: rest.id_stasiun ?? undefined,
    ...(password?.trim() ? { password } : {}),
  });

  return jsonOk(updated);
});

// DELETE /api/pengguna/:id (ADMIN)
export const DELETE = route<Ctx>(async (req, ctx) => {
  await requireAdmin(req);
  const id = await parseIdParam(ctx);
  await deletePengguna(id);
  return jsonOk({ message: "Pengguna berhasil dihapus" });
});
