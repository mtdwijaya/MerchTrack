import { NextResponse } from "next/server";

import { getMerchandiseSummary } from "@/lib/merchandise";

export async function GET() {
  try {
    const summary = await getMerchandiseSummary();
    return NextResponse.json(summary);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Gagal mengambil summary merchandise" },
      { status: 500 }
    );
  }
}
