import { NextResponse } from "next/server";

import { isAuthError, requireAuth } from "@/lib/api-auth";
import { getDashboardData } from "@/lib/dashboard";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const data = await getDashboardData();

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Gagal mengambil dashboard" },
      { status: 500 }
    );
  }
}
