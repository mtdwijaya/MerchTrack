import { NextResponse } from "next/server";

import {
  deleteMerchandise,
  getMerchandiseById,
  updateMerchandise,
} from "@/lib/merchandise";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await getMerchandiseById(Number(id));

    if (!data) {
      return NextResponse.json(
        { message: "Merchandise tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Terjadi kesalahan" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!body.nama_merch?.trim()) {
      return NextResponse.json(
        { message: "Nama merchandise wajib diisi" },
        { status: 400 }
      );
    }

    const data = await updateMerchandise(Number(id), {
      nama_merch: body.nama_merch.trim(),
      deskripsi: body.deskripsi?.trim() || undefined,
      jumlah_stok: Number(body.jumlah_stok),
    });

    return NextResponse.json(data);
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

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteMerchandise(Number(id));

    return NextResponse.json({ message: "Merchandise berhasil dihapus" });
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
