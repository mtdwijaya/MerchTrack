import { NextResponse } from "next/server";

import { isAuthError, requireAuth } from "@/lib/api-auth";
import { getRiwayatTransaksiSummary } from "@/lib/riwayat-transaksi";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const summary = await getRiwayatTransaksiSummary();
    return NextResponse.json(summary);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Gagal mengambil summary riwayat transaksi" },
      { status: 500 }
    );
  }
}
