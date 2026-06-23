import { NextResponse } from "next/server";

import { getMonitoringSummary } from "@/lib/monitoring";

export async function GET() {
  try {
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
