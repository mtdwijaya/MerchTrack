import { NextResponse } from "next/server";

import {
  createBarangKeluar,
  getBarangKeluarPaginated,
  parseBarangKeluarSort,
} from "@/lib/barang-keluar";
import { verifyToken } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 10);
    const search = searchParams.get("search") || "";
    const idStasiun = searchParams.get("id_stasiun");
    const idKategori = searchParams.get("id_kategori");

    const { sortBy, sortOrder } = parseBarangKeluarSort(
      searchParams.get("sortBy"),
      searchParams.get("sortOrder")
    );

    const result = await getBarangKeluarPaginated({
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      idStasiun: idStasiun ? Number(idStasiun) : undefined,
      idKategori: idKategori ? Number(idKategori) : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Gagal mengambil data" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const tokenData = await verifyToken();

    if (!tokenData) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const data = await createBarangKeluar({
      id_merch: Number(body.id_merch),
      id_stasiun: Number(body.id_stasiun),
      id_kategori: Number(body.id_kategori),
      id_user: tokenData.id_user,
      jumlah: Number(body.jumlah),
      tanggal_keluar: body.tanggal_keluar
        ? new Date(body.tanggal_keluar)
        : undefined,
      keterangan: body.keterangan,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Terjadi kesalahan",
      },
      { status: 400 }
    );
  }
}
