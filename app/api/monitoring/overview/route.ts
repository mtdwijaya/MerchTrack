import { NextResponse } from "next/server";

import { getMonitoringOverview } from "@/lib/monitoring-overview";

export async function GET() {
  try {
    const data = await getMonitoringOverview();
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Gagal mengambil data monitoring" },
      { status: 500 }
    );
  }
}
