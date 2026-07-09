import { authenticate, jsonError, jsonOk, parseJson, route } from "@/lib/api";
import {
  consumeRateLimit,
  loginRateLimitKey,
  resetRateLimit,
} from "@/lib/rate-limit";
import { getClientIpFromRequest } from "@/lib/request-ip";
import { loginSchema } from "@/lib/validations";

// POST /api/auth/login — tukar email+password dengan JWT Bearer token
export const POST = route(async (req) => {
  const ip = getClientIpFromRequest(req);
  const rate = consumeRateLimit(loginRateLimitKey(ip));

  if (!rate.ok) {
    return jsonError(
      `Terlalu banyak percobaan login. Coba lagi dalam ${rate.retryAfterSeconds} detik.`,
      429
    );
  }

  const { email, password } = await parseJson(req, loginSchema);
  const result = await authenticate(email, password);
  resetRateLimit(loginRateLimitKey(ip));
  return jsonOk(result);
});
