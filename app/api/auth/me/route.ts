import { jsonOk, requireUser, route } from "@/lib/api";

// GET /api/auth/me — info user dari token yang dikirim
export const GET = route((req) => {
  const user = requireUser(req);
  return jsonOk({ user });
});
