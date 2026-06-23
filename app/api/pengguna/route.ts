import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import {
  createPengguna,
  getPenggunaPaginated,
  parsePenggunaSort,
} from "@/lib/pengguna";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 5);
    const search = searchParams.get("search") || "";
    const roleParam = searchParams.get("role");

    const { sortBy, sortOrder } = parsePenggunaSort(
      searchParams.get("sortBy"),
      searchParams.get("sortOrder")
    );

    const result = await getPenggunaPaginated({
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      role: roleParam === "ADMIN" || roleParam === "PETUGAS" ? roleParam : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Gagal mengambil data pengguna" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.nama_user?.trim() || !body.email?.trim() || !body.password?.trim()) {
      return NextResponse.json(
        { message: "Nama, email, dan password wajib diisi" },
        { status: 400 }
      );
    }

    const data = await createPengguna({
      nama_user: body.nama_user.trim(),
      email: body.email.trim(),
      password: body.password,
      role: body.role as Role,
      id_stasiun: body.id_stasiun ? Number(body.id_stasiun) : undefined,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Gagal menambahkan pengguna",
      },
      { status: 400 }
    );
  }
}
