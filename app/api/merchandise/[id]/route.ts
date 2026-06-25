import { NextResponse } from "next/server";

import { isAuthError, requireAuth } from "@/lib/api-auth";
import {
  deleteMerchandise,
  getMerchandiseById,
  revalidateMerchandiseListCache,
  updateMerchandise,
} from "@/lib/merchandise";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

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
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

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
    });

    revalidateMerchandiseListCache();

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
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const { id } = await params;
    await deleteMerchandise(Number(id));

    revalidateMerchandiseListCache();

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
