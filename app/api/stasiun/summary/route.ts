import { NextResponse } from "next/server";

import { isAuthError, requireAuth } from "@/lib/api-auth";
import { getStasiunSummary } from "@/lib/stasiun";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const summary = await getStasiunSummary();
    return NextResponse.json(summary);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Gagal mengambil summary stasiun" },
      { status: 500 }
    );
  }
}
