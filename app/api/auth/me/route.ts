import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET() {
  try {
    const tokenData =
      await verifyToken();

    if (!tokenData) {
      return NextResponse.json(
        {
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const user =
      await prisma.user.findUnique({
        where: {
          id_user:
            tokenData.id_user,
        },

        include: {
          stasiun: true,
        },
      });

    if (!user) {
      return NextResponse.json(
        {
          message: "User tidak ditemukan",
        },
        {
          status: 401,
        }
      );
    }

    return NextResponse.json({
      id_user: user.id_user,

      nama_user: user.nama_user,

      email: user.email,

      role: user.role,

      stasiun: user.stasiun,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message:
          "Terjadi kesalahan server",
      },
      {
        status: 500,
      }
    );
  }
}