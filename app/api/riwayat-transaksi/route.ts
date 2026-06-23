import { NextResponse } from "next/server";

import {
  getRiwayatTransaksiPaginated,
  parseRiwayatSort,
} from "@/lib/riwayat-transaksi";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 5);
    const search = searchParams.get("search") || "";
    const idKategori = searchParams.get("id_kategori");
    const tanggal = searchParams.get("tanggal") || undefined;

    const { sortBy, sortOrder } = parseRiwayatSort(
      searchParams.get("sortBy"),
      searchParams.get("sortOrder")
    );

    const result = await getRiwayatTransaksiPaginated({
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      idKategori: idKategori ? Number(idKategori) : undefined,
      tanggal,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Gagal mengambil riwayat transaksi" },
      { status: 500 }
    );
  }
}
