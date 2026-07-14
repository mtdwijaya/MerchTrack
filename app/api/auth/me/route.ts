import { jsonOk, requireUser, route } from "@/lib/api";

/**
 * GET /api/auth/me
 * Tujuan: mengembalikan data user dari JWT di header Authorization.
 * Berguna untuk cek "siapa yang sedang login" di REST client.
 */
export const GET = route((req) => {
  // Wajib ada header: Authorization: Bearer <token>
  // Jika token hilang/kadaluarsa → ApiError 401 (ditangkap oleh route())
  const user = requireUser(req);

  // Shape: { success: true, data: { user: { id_user, email, role, ... } } }
  return jsonOk({ user });
});
