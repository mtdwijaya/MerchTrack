import { authenticate, jsonError, jsonOk, parseJson, route } from "@/lib/api";
import {
  consumeRateLimit,
  loginRateLimitKey,
  resetRateLimit,
} from "@/lib/rate-limit";
import { getClientIpFromRequest } from "@/lib/request-ip";
import { loginSchema } from "@/lib/validations";

/**
 * POST /api/auth/login
 * Tujuan: menerima email+password, lalu mengembalikan JWT Bearer token.
 * Dipakai oleh REST client (Postman/mobile), bukan cookie session UI.
 */
export const POST = route(async (req) => {
  // 1) Ambil IP klien — dipakai sebagai kunci rate limit (anti brute-force)
  const ip = getClientIpFromRequest(req);

  // 2) Hitungan percobaan login: max 5x / 60 detik per IP
  //    Jika sudah melewati batas → HTTP 429 + info berapa detik harus menunggu
  const rate = consumeRateLimit(loginRateLimitKey(ip));
  if (!rate.ok) {
    return jsonError(
      `Terlalu banyak percobaan login. Coba lagi dalam ${rate.retryAfterSeconds} detik.`,
      429
    );
  }

  // 3) Baca & validasi body JSON { email, password } lewat Zod (loginSchema)
  const { email, password } = await parseJson(req, loginSchema);

  // 4) Cek kredensial di DB + buat JWT (lihat authenticate di lib/api.ts)
  const result = await authenticate(email, password);

  // 5) Login sukses → hapus counter rate limit IP ini agar tidak "menghukum" user sah
  resetRateLimit(loginRateLimitKey(ip));

  // 6) Response: { success: true, data: { token, user } }
  return jsonOk(result);
});
