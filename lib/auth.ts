import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export interface JwtPayload {
  id_user: number;
  email: string;
  role: string;
}

export async function verifyToken() {
  try {
    const cookieStore = await cookies();

    const token =
      cookieStore.get("token")?.value;

    if (!token) {
      return null;
    }

    return jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as JwtPayload;
  } catch {
    return null;
  }
}