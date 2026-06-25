import { NextResponse } from "next/server";

import { verifyToken, type JwtPayload } from "@/lib/auth";

export type AuthResult = JwtPayload | NextResponse;

export function isAuthError(result: AuthResult): result is NextResponse {
  return result instanceof NextResponse;
}

export async function requireAuth(): Promise<AuthResult> {
  const tokenData = await verifyToken();

  if (!tokenData) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return tokenData;
}

export async function requireAdmin(): Promise<AuthResult> {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  // halaman pengguna & beberapa api hanya untuk role admin
  if (auth.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  return auth;
}
