import { NextResponse } from "next/server";

import { isAuthError, requireAuth } from "@/lib/api-auth";
import { getMonitoringSummary } from "@/lib/monitoring";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const summary = await getMonitoringSummary();
    return NextResponse.json(summary);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Gagal mengambil summary monitoring" },
      { status: 500 }
    );
  }
}
