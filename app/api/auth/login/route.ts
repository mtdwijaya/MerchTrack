import { prisma } from "@/lib/prisma";
import { loginUser } from "@/lib/login-user";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const result = await loginUser(email, password);

    if (!result.ok) {
      return NextResponse.json(
        { message: result.message },
        { status: result.message.includes("wajib") ? 400 : 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id_user: true,
        nama_user: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Login berhasil",
      user,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}