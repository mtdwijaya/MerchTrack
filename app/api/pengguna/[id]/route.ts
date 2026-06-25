import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { isAuthError, requireAdmin } from "@/lib/api-auth";
import {
  deletePengguna,
  getPenggunaById,
  updatePengguna,
} from "@/lib/pengguna";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (isAuthError(auth)) return auth;

    const { id } = await params;
    const data = await getPenggunaById(Number(id));

    if (!data) {
      return NextResponse.json(
        { message: "Pengguna tidak ditemukan" },
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
    const auth = await requireAdmin();
    if (isAuthError(auth)) return auth;

    const { id } = await params;
    const body = await req.json();

    if (!body.nama_user?.trim() || !body.email?.trim()) {
      return NextResponse.json(
        { message: "Nama dan email wajib diisi" },
        { status: 400 }
      );
    }

    const data = await updatePengguna(Number(id), {
      nama_user: body.nama_user.trim(),
      email: body.email.trim(),
      password: body.password,
      role: body.role as Role,
      id_stasiun: body.id_stasiun ? Number(body.id_stasiun) : null,
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
    const auth = await requireAdmin();
    if (isAuthError(auth)) return auth;

    const { id } = await params;
    await deletePengguna(Number(id));

    return NextResponse.json({ message: "Pengguna berhasil dihapus" });
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
