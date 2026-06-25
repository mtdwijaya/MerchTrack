import { NextResponse } from "next/server";

import { isAuthError, requireAuth } from "@/lib/api-auth";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "User tidak ditemukan" }, { status: 401 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
