import { NextResponse } from "next/server";

import { getRiwayatTransaksiSummary } from "@/lib/riwayat-transaksi";

export async function GET() {
  try {
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
