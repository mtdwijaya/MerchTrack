import { NextResponse } from "next/server";

import { getPenggunaSummary } from "@/lib/pengguna";

export async function GET() {
  try {
    const summary = await getPenggunaSummary();
    return NextResponse.json(summary);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Gagal mengambil summary pengguna" },
      { status: 500 }
    );
  }
}
