import { NextResponse } from "next/server";

import { isAuthError, requireAuth } from "@/lib/api-auth";
import {
  getMonitoringPaginated,
  parseMonitoringSort,
  StockStatus,
} from "@/lib/monitoring";

export async function GET(request: Request) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const { searchParams } = new URL(request.url);

    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 5);
    const search = searchParams.get("search") || "";
    const statusParam = searchParams.get("status");

    const { sortBy, sortOrder } = parseMonitoringSort(
      searchParams.get("sortBy"),
      searchParams.get("sortOrder")
    );

    const status =
      statusParam === "normal" ||
      statusParam === "rendah" ||
      statusParam === "habis"
        ? (statusParam as StockStatus)
        : undefined;

    const result = await getMonitoringPaginated({
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      status,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Gagal mengambil data monitoring" },
      { status: 500 }
    );
  }
}
