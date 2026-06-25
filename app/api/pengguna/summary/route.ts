import { NextResponse } from "next/server";

import { isAuthError, requireAdmin } from "@/lib/api-auth";
import { getPenggunaSummary } from "@/lib/pengguna";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (isAuthError(auth)) return auth;

    const summary = await getPenggunaSummary();
    return NextResponse.json(summary);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Gagal mengambil summary pengguna" },
      { status: 500 }
    );
  }
}
