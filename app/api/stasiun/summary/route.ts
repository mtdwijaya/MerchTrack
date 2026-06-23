import { NextResponse } from "next/server";

import { getStasiunSummary } from "@/lib/stasiun";

export async function GET() {
  try {
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
