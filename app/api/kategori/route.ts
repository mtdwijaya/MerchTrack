import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const data =
      await prisma.kategoriPenggunaan.findMany(
        {
          orderBy: {
            nama_kategori: "asc",
          },
        }
      );

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message:
          "Gagal mengambil data kategori",
      },
      {
        status: 500,
      }
    );
  }
}