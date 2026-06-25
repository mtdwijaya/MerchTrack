import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getMonitoringOverview } from "@/lib/monitoring-overview";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const data = await getMonitoringOverview(user);

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Gagal mengambil data monitoring" },
      { status: 500 }
    );
  }
}
