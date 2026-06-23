import { NextResponse } from "next/server";

import {
  getBarangKeluarById,
  updateBarangKeluar,
  deleteBarangKeluar,
} from "@/lib/barang-keluar";

export async function GET(
  req: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id } =
      await params;

    const data =
      await getBarangKeluarById(
        Number(id)
      );

    if (!data) {
      return NextResponse.json(
        {
          message:
            "Data tidak ditemukan",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message:
          "Terjadi kesalahan",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(
  req: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id } =
      await params;

    const body =
      await req.json();

    const data =
      await updateBarangKeluar(
        Number(id),
        {
          id_merch:
            Number(
              body.id_merch
            ),

          id_stasiun:
            Number(
              body.id_stasiun
            ),

          id_kategori:
            Number(
              body.id_kategori
            ),

          jumlah:
            Number(body.jumlah),

          tanggal_keluar:
            body.tanggal_keluar
              ? new Date(
                  body.tanggal_keluar
                )
              : undefined,

          keterangan:
            body.keterangan,
        }
      );

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
      {
        status: 400,
      }
    );
  }
}

export async function DELETE(
  req: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id } =
      await params;

    await deleteBarangKeluar(
      Number(id)
    );

    return NextResponse.json({
      message:
        "Data berhasil dihapus",
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
      {
        status: 400,
      }
    );
  }
}