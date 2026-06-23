import { NextResponse } from "next/server";

import {
  createMerchandise,
  getAllMerchandiseWithStok,
  getMerchandisePaginated,
  parseMerchandiseSort,
} from "@/lib/merchandise";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get("page");

    if (pageParam) {
      const page = Number(pageParam) || 1;
      const limit = Number(searchParams.get("limit") || 5);
      const search = searchParams.get("search") || "";

      const { sortBy, sortOrder } = parseMerchandiseSort(
        searchParams.get("sortBy"),
        searchParams.get("sortOrder")
      );

      const result = await getMerchandisePaginated({
        page,
        limit,
        search,
        sortBy,
        sortOrder,
      });

      return NextResponse.json(result);
    }

    const data = await getAllMerchandiseWithStok();
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Gagal mengambil data merchandise" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.nama_merch?.trim()) {
      return NextResponse.json(
        { message: "Nama merchandise wajib diisi" },
        { status: 400 }
      );
    }

    const data = await createMerchandise({
      nama_merch: body.nama_merch.trim(),
      deskripsi: body.deskripsi?.trim() || undefined,
      jumlah_stok: Number(body.jumlah_stok) || 0,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Gagal menambahkan merchandise",
      },
      { status: 400 }
    );
  }
}
