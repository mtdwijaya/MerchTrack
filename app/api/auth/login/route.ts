import { authenticate, jsonOk, parseJson, route } from "@/lib/api";
import { loginSchema } from "@/lib/validations";

// POST /api/auth/login — tukar email+password dengan JWT Bearer token
export const POST = route(async (req) => {
  const { email, password } = await parseJson(req, loginSchema);
  const result = await authenticate(email, password);
  return jsonOk(result);
});
