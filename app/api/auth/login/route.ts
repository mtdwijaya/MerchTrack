import { prisma } from "@/lib/prisma";
import { getAuthCookieOptions } from "@/lib/auth";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        {
          message: "Email dan password wajib diisi",
        },
        {
          status: 400,
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      include: {
        stasiun: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          message: "Email atau password salah",
        },
        {
          status: 401,
        }
      );
    }

    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {
      return NextResponse.json(
        {
          message: "Email atau password salah",
        },
        {
          status: 401,
        }
      );
    }

    const token = jwt.sign(
      {
        // simpan data user di jwt supaya getCurrentUser tidak perlu query db tiap navigasi
        id_user: user.id_user,
        email: user.email,
        role: user.role,
        nama_user: user.nama_user,
        id_stasiun: user.id_stasiun,
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "1d",
      }
    );

    const cookieStore = await cookies();

    cookieStore.set({
      name: "token",
      value: token,
      ...getAuthCookieOptions(60 * 60 * 24),
    });

    return NextResponse.json({
      success: true,
      message: "Login berhasil",
      user: {
        id_user: user.id_user,
        nama_user: user.nama_user,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Terjadi kesalahan server",
      },
      {
        status: 500,
      }
    );
  }
}