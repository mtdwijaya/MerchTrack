import { NextResponse } from "next/server";

import {
  deleteStasiun,
  getStasiunById,
  updateStasiun,
} from "@/lib/stasiun";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const data = await getStasiunById(Number(id));

    if (!data) {
      return NextResponse.json(
        { message: "Stasiun tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!body.kode_stasiun?.trim() || !body.nama_stasiun?.trim()) {
      return NextResponse.json(
        { message: "Kode stasiun dan nama stasiun wajib diisi" },
        { status: 400 }
      );
    }

    const data = await updateStasiun(Number(id), {
      kode_stasiun: body.kode_stasiun.trim(),
      nama_stasiun: body.nama_stasiun.trim(),
      alamat: body.alamat?.trim() || undefined,
      kontak: body.kontak?.trim() || undefined,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan",
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

    await deleteStasiun(Number(id));

    return NextResponse.json({
      message: "Stasiun berhasil dihapus",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan",
      },
      { status: 400 }
    );
  }
}
