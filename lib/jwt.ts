import jwt from "jsonwebtoken";

import { env } from "@/lib/env";

export type JwtSignPayload = {
  id_user: number;
  email: string;
  role: string;
  nama_user: string;
  id_stasiun: number | null;
};

export function signAuthToken(
  payload: JwtSignPayload,
  expiresIn: string | number = "1d"
) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn,
    algorithm: "HS256",
  } as jwt.SignOptions);
}

export function verifyAuthToken<T extends object = JwtSignPayload>(
  token: string
): T {
  const decoded = jwt.verify(token, env.JWT_SECRET, {
    algorithms: ["HS256"] as jwt.Algorithm[],
  });
  return decoded as unknown as T;
}
