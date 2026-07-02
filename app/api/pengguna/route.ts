import { getQuery, jsonOk, parseJson, requireAdmin, route } from "@/lib/api";
import {
  createPengguna,
  getPenggunaPaginated,
  getPenggunaSummary,
  parsePenggunaSort,
} from "@/lib/pengguna";
import { parseSortValue } from "@/lib/sort";
import { penggunaCreateSchema } from "@/lib/validations";
import type { Role } from "@prisma/client";

// GET /api/pengguna?page=&limit=&search=&sort=nama_user:asc&role=ADMIN (ADMIN)
export const GET = route(async (req) => {
  await requireAdmin(req);
  const q = getQuery(req);
  const { sortBy, sortOrder } = parseSortValue(
    q.str("sort", "nama_user:asc"),
    "nama_user",
    "asc"
  );
  const parsed = parsePenggunaSort(sortBy, sortOrder);

  const roleParam = q.str("role").toUpperCase();
  const role: Role | undefined =
    roleParam === "ADMIN" || roleParam === "PETUGAS" ? (roleParam as Role) : undefined;

  const [list, summary] = await Promise.all([
    getPenggunaPaginated({
      page: q.num("page", 1),
      limit: q.num("limit", 10),
      search: q.str("search") || undefined,
      sortBy: parsed.sortBy,
      sortOrder: parsed.sortOrder,
      role,
    }),
    getPenggunaSummary(),
  ]);

  return jsonOk({ ...list, summary });
});

// POST /api/pengguna — buat pengguna baru (ADMIN)
export const POST = route(async (req) => {
  await requireAdmin(req);
  const data = await parseJson(req, penggunaCreateSchema);

  const created = await createPengguna({
    nama_user: data.nama_user,
    email: data.email,
    password: data.password,
    role: data.role,
    id_stasiun: data.id_stasiun ?? undefined,
  });

  return jsonOk(created, 201);
});
