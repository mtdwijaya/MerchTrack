import { NextResponse } from "next/server";

import { isAuthError, requireAuth } from "@/lib/api-auth";
import {
  createStasiun,
  getAllStasiun,
  getStasiunPaginated,
  parseStasiunSort,
  revalidateStasiunCache,
} from "@/lib/stasiun";

export async function GET(request: Request) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get("page");

    if (pageParam) {
      const page = Number(pageParam) || 1;
      const limit = Number(searchParams.get("limit") || 5);
      const search = searchParams.get("search") || "";
      const { sortBy, sortOrder } = parseStasiunSort(
        searchParams.get("sortBy"),
        searchParams.get("sortOrder")
      );

      const result = await getStasiunPaginated({
        page,
        limit,
        search,
        sortBy,
        sortOrder,
      });

      return NextResponse.json(result);
    }

    const data = await getAllStasiun();
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Gagal mengambil data stasiun" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const body = await request.json();

    if (!body.kode_stasiun?.trim() || !body.nama_stasiun?.trim()) {
      return NextResponse.json(
        { message: "Kode stasiun dan nama stasiun wajib diisi" },
        { status: 400 }
      );
    }

    const data = await createStasiun({
      kode_stasiun: body.kode_stasiun.trim(),
      nama_stasiun: body.nama_stasiun.trim(),
      alamat: body.alamat?.trim() || undefined,
      kontak: body.kontak?.trim() || undefined,
    });

    revalidateStasiunCache();

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Gagal menambahkan stasiun",
      },
      { status: 400 }
    );
  }
}
