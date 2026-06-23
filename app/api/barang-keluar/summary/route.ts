import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const totalTransaksi =
      await prisma.barangKeluar.count();

    const totalBarangKeluar =
      await prisma.barangKeluar.aggregate({
        _sum: {
          jumlah: true,
        },
      });

    const stasiunAktif =
      await prisma.barangKeluar.groupBy({
        by: ["id_stasiun"],
      });

    return NextResponse.json({
      totalTransaksi,

      totalBarangKeluar:
        totalBarangKeluar._sum
          .jumlah ?? 0,

      totalStasiun:
        stasiunAktif.length,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message:
          "Gagal mengambil summary",
      },
      {
        status: 500,
      }
    );
  }
}