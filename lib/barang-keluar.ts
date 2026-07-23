import { randomUUID } from "crypto";

import { prisma } from "@/lib/prisma";
import { deleteEditLogsForTransaksi } from "@/lib/aktivitas-log-db";
import {
  normalizeDetailTujuan,
  validateDetailTujuan,
} from "@/lib/detail-tujuan";
import { barangKeluarListInclude } from "@/lib/prisma-selects";
import type {
  BarangKeluarCreateData,
  BarangKeluarWithRelations,
} from "@/lib/barang-keluar-types";
import {
  asBarangKeluarWithRelations,
  asBarangKeluarWithRelationsList,
} from "@/lib/barang-keluar-types";
import { getTujuanById } from "@/lib/tujuan";
import { deleteUploadedPublicFile } from "@/lib/upload-file-cleanup";
import { Prisma } from "@prisma/client";
import { SortOrder } from "@/lib/sort";

export type BarangKeluarSortField =
  | "id_keluar"
  | "tanggal_keluar"
  | "nama_merch"
  | "nama_tujuan"
  | "jumlah";

const SORT_FIELDS: BarangKeluarSortField[] = [
  "id_keluar",
  "tanggal_keluar",
  "nama_merch",
  "nama_tujuan",
  "jumlah",
];

export function parseBarangKeluarSort(
  sortBy?: string | null,
  sortOrder?: string | null
): { sortBy: BarangKeluarSortField; sortOrder: SortOrder } {
  const field = SORT_FIELDS.includes(sortBy as BarangKeluarSortField)
    ? (sortBy as BarangKeluarSortField)
    : "tanggal_keluar";

  return {
    sortBy: field,
    sortOrder: sortOrder === "asc" ? "asc" : "desc",
  };
}

function buildOrderBy(
  sortBy: BarangKeluarSortField,
  sortOrder: SortOrder
): Prisma.BarangKeluarOrderByWithRelationInput {
  switch (sortBy) {
    case "nama_merch":
      return { merchandise: { nama_merch: sortOrder } };
    case "nama_tujuan":
      return { tujuan: { nama_tujuan: sortOrder } };
    default:
      return { [sortBy]: sortOrder };
  }
}

export function buildSearchWhere(search?: string): Prisma.BarangKeluarWhereInput {
  if (!search?.trim()) return {};

  const term = search.trim();
  // support cari by id transaksi (#123 atau 123)
  const numericId = Number(term.replace(/^#?/i, ""));

  const orFilters: Prisma.BarangKeluarWhereInput[] = [
    {
      merchandise: {
        is: {
          nama_merch: { contains: term, mode: "insensitive" },
        },
      },
    },
    {
      tujuan: {
        is: {
          nama_tujuan: { contains: term, mode: "insensitive" },
        },
      },
    },
    {
      stasiun: {
        is: {
          nama_stasiun: { contains: term, mode: "insensitive" },
        },
      },
    },
    {
      unit: {
        is: {
          nama_unit: { contains: term, mode: "insensitive" },
        },
      },
    },
    {
      detail_teks: { contains: term, mode: "insensitive" },
    },
    {
      nama_petugas: { contains: term, mode: "insensitive" },
    },
  ];

  if (!Number.isNaN(numericId)) {
    orFilters.push({ id_keluar: numericId });
  }

  return { OR: orFilters };
}

export async function getBarangKeluarPaginated({
  page,
  limit,
  search,
  sortBy = "tanggal_keluar",
  sortOrder = "desc",
  idTujuan,
}: {
  page: number;
  limit: number;
  search?: string;
  sortBy?: BarangKeluarSortField;
  sortOrder?: SortOrder;
  idTujuan?: number;
}) {
  const skip = (page - 1) * limit;

  const where: Prisma.BarangKeluarWhereInput = {
    ...buildSearchWhere(search),
  };

  if (idTujuan) where.id_tujuan = idTujuan;

  const [data, total] = await Promise.all([
    prisma.barangKeluar.findMany({
      where,
      include: barangKeluarListInclude,
      orderBy: buildOrderBy(sortBy, sortOrder),
      skip,
      take: limit,
    }),
    prisma.barangKeluar.count({ where }),
  ]);

  return {
    data,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getBarangKeluarById(
  id: number
): Promise<BarangKeluarWithRelations | null> {
  const row = await prisma.barangKeluar.findUnique({
    where: { id_keluar: id },
    include: barangKeluarListInclude,
  });

  return row ? asBarangKeluarWithRelations(row) : null;
}

type BarangKeluarHeaderInput = {
  nama_petugas: string;
  id_tujuan: number;
  id_stasiun?: number | null;
  id_unit?: number | null;
  detail_teks?: string | null;
  tanggal_keluar?: Date;
  keterangan?: string;
  bukti_path?: string | null;
  bukti_nama?: string | null;
};

type BarangKeluarInput = BarangKeluarHeaderInput & {
  id_merch: number;
  jumlah: number;
};

type BarangKeluarBatchInput = BarangKeluarHeaderInput & {
  items: { id_merch: number; jumlah: number }[];
};

async function validateBarangKeluarInput(data: BarangKeluarHeaderInput) {
  // cek tujuan valid + detail stasiun/unit sesuai jenis tujuan
  const tujuan = await getTujuanById(data.id_tujuan);
  if (!tujuan) {
    throw new Error("Tujuan tidak ditemukan");
  }

  const detailError = validateDetailTujuan(tujuan, data);
  if (detailError) {
    throw new Error(detailError);
  }

  return { tujuan, detail: normalizeDetailTujuan(tujuan.jenis_detail, data) };
}

async function assertStockAvailable(
  tx: Prisma.TransactionClient,
  items: { id_merch: number; jumlah: number }[]
) {
  for (const item of items) {
    const [stok, merch] = await Promise.all([
      tx.stok.findUnique({ where: { id_merch: item.id_merch } }),
      tx.merchandise.findUnique({
        where: { id_merch: item.id_merch },
        select: { nama_merch: true },
      }),
    ]);

    if (!stok) {
      throw new Error("Data stok tidak ditemukan");
    }

    if (stok.jumlah_stok < item.jumlah) {
      throw new Error(
        `Stok ${merch?.nama_merch ?? "merchandise"} tidak mencukupi`
      );
    }
  }
}

export async function createBarangKeluarBatch(
  data: BarangKeluarBatchInput & { id_user: number }
) {
  const { detail } = await validateBarangKeluarInput(data);

  const merchIds = data.items.map((item) => item.id_merch);
  if (new Set(merchIds).size !== merchIds.length) {
    throw new Error("Merchandise tidak boleh duplikat dalam satu transaksi");
  }

  const id_grup = data.items.length > 1 ? randomUUID() : null;
  const tanggalKeluar = data.tanggal_keluar ?? new Date();

  return prisma.$transaction(async (tx) => {
    await assertStockAvailable(tx, data.items);

    const created = [];

    for (const item of data.items) {
      const createData: BarangKeluarCreateData = {
          id_grup,
          id_merch: item.id_merch,
          id_tujuan: data.id_tujuan,
          id_user: data.id_user,
          nama_petugas: data.nama_petugas.trim(),
          id_stasiun: detail.id_stasiun,
          id_unit: detail.id_unit,
          detail_teks: detail.detail_teks,
          jumlah: item.jumlah,
          tanggal_keluar: tanggalKeluar,
          dicatat_pada: tanggalKeluar,
          keterangan: data.keterangan,
          bukti_path: data.bukti_path ?? null,
          bukti_nama: data.bukti_nama ?? null,
        };

      const transaksi = await tx.barangKeluar.create({
        data: createData as Prisma.BarangKeluarUncheckedCreateInput,
      });

      await tx.stok.update({
        where: { id_merch: item.id_merch },
        data: {
          jumlah_stok: { decrement: item.jumlah },
        },
      });

      created.push(transaksi);
    }

    return created;
  });
}

export async function updateBarangKeluarBatch(
  anchorId: number,
  data: BarangKeluarBatchInput & {
    items: { id_keluar: number; id_merch: number; jumlah: number }[];
  },
  bukti?: { bukti_path: string | null; bukti_nama: string | null }
) {
  const anchor = await getBarangKeluarById(anchorId);
  if (!anchor) {
    throw new Error("Transaksi tidak ditemukan");
  }

  const existingItems = anchor.id_grup
    ? await getBarangKeluarByGrup(anchor.id_grup)
    : [anchor];

  if (data.items.length !== existingItems.length) {
    throw new Error("Jumlah merchandise tidak dapat diubah saat edit");
  }

  const existingIds = new Set(existingItems.map((item) => item.id_keluar));
  for (const item of data.items) {
    if (!existingIds.has(item.id_keluar)) {
      throw new Error("Data merchandise tidak valid");
    }
  }

  const buktiPatch = bukti
    ? { bukti_path: bukti.bukti_path, bukti_nama: bukti.bukti_nama }
    : {};

  for (const item of data.items) {
    await updateBarangKeluar(item.id_keluar, {
      nama_petugas: data.nama_petugas,
      id_merch: item.id_merch,
      id_tujuan: data.id_tujuan,
      id_stasiun: data.id_stasiun,
      id_unit: data.id_unit,
      detail_teks: data.detail_teks,
      jumlah: item.jumlah,
      tanggal_keluar: data.tanggal_keluar,
      keterangan: data.keterangan,
      ...buktiPatch,
    });
  }
}

export async function getBarangKeluarByGrup(
  id_grup: string
): Promise<BarangKeluarWithRelations[]> {
  const rows = await prisma.barangKeluar.findMany({
    where: { id_grup } as Prisma.BarangKeluarWhereInput,
    include: barangKeluarListInclude,
    orderBy: { id_keluar: "asc" },
  });

  return asBarangKeluarWithRelationsList(rows);
}

export async function createBarangKeluar(
  data: BarangKeluarInput & { id_user: number }
) {
  const { detail } = await validateBarangKeluarInput(data);

  return prisma.$transaction(async (tx) => {
    const stok = await tx.stok.findUnique({
      where: { id_merch: data.id_merch },
    });

    if (!stok) {
      throw new Error("Data stok tidak ditemukan");
    }

    // stok harus cukup sebelum barang keluar dicatat
    if (stok.jumlah_stok < data.jumlah) {
      throw new Error("Stok tidak mencukupi");
    }

    const tanggalKeluar = data.tanggal_keluar ?? new Date();

    // bukti_path/nama ikut disimpan kalo ada upload di form
    const transaksi = await tx.barangKeluar.create({
      data: {
        id_merch: data.id_merch,
        id_tujuan: data.id_tujuan,
        id_user: data.id_user,
        nama_petugas: data.nama_petugas.trim(),
        id_stasiun: detail.id_stasiun,
        id_unit: detail.id_unit,
        detail_teks: detail.detail_teks,
        jumlah: data.jumlah,
        tanggal_keluar: tanggalKeluar,
        dicatat_pada: tanggalKeluar,
        keterangan: data.keterangan,
        bukti_path: data.bukti_path ?? null,
        bukti_nama: data.bukti_nama ?? null,
      },
    });

    await tx.stok.update({
      where: { id_merch: data.id_merch },
      data: {
        jumlah_stok: { decrement: data.jumlah },
      },
    });

    return transaksi;
  });
}

export async function updateBarangKeluar(id: number, data: BarangKeluarInput) {
  const { detail } = await validateBarangKeluarInput(data);

  return prisma.$transaction(async (tx) => {
    const transaksiLama = await tx.barangKeluar.findUnique({
      where: { id_keluar: id },
    });

    if (!transaksiLama) {
      throw new Error("Transaksi tidak ditemukan");
    }

    // abis ada pengembalian: edit metadata aja, tanpa ubah stok
    if (transaksiLama.jumlah_kembali > 0) {
      return tx.barangKeluar.update({
        where: { id_keluar: id },
        data: {
          nama_petugas: data.nama_petugas.trim(),
          id_tujuan: data.id_tujuan,
          id_stasiun: detail.id_stasiun,
          id_unit: detail.id_unit,  
          detail_teks: detail.detail_teks,
          tanggal_keluar: data.tanggal_keluar,
          keterangan: data.keterangan,
          ...(data.bukti_path !== undefined
            ? {
                bukti_path: data.bukti_path,
                bukti_nama: data.bukti_nama,
              }
            : {}),
        },
      });
    }

    await tx.stok.update({
      where: { id_merch: transaksiLama.id_merch },
      data: {
        jumlah_stok: { increment: transaksiLama.jumlah },
      },
    });

    const stokBaru = await tx.stok.findUnique({
      where: { id_merch: data.id_merch },
    });

    if (!stokBaru || stokBaru.jumlah_stok < data.jumlah) {
      throw new Error("Stok tidak mencukupi");
    }

    await tx.stok.update({
      where: { id_merch: data.id_merch },
      data: {
        jumlah_stok: { decrement: data.jumlah },
      },
    });

    return tx.barangKeluar.update({
      where: { id_keluar: id },
      data: {
        id_merch: data.id_merch,
        id_tujuan: data.id_tujuan,
        nama_petugas: data.nama_petugas.trim(),
        id_stasiun: detail.id_stasiun,
        id_unit: detail.id_unit,
        detail_teks: detail.detail_teks,
        jumlah: data.jumlah,
        tanggal_keluar: data.tanggal_keluar,
        keterangan: data.keterangan,
        ...(data.bukti_path !== undefined
          ? {
              bukti_path: data.bukti_path,
              bukti_nama: data.bukti_nama,
            }
          : {}),
      },
    });
  });
}

export async function deleteBarangKeluar(id: number) {
  return prisma.$transaction(async (tx) => {
    const transaksi = await tx.barangKeluar.findUnique({
      where: { id_keluar: id },
    });

    if (!transaksi) {
      throw new Error("Transaksi tidak ditemukan");
    }

    const idGrup = (transaksi as { id_grup?: string | null }).id_grup ?? null;

    const targets: BarangKeluarWithRelations[] = idGrup
      ? asBarangKeluarWithRelationsList(
          await tx.barangKeluar.findMany({
            where: { id_grup: idGrup } as Prisma.BarangKeluarWhereInput,
            include: barangKeluarListInclude,
          })
        )
      : [asBarangKeluarWithRelations(transaksi as BarangKeluarWithRelations)];

    const buktiPaths = new Set(
      targets
        .map((item) => item.bukti_path)
        .filter((path): path is string => Boolean(path))
    );

    for (const item of targets) {
      await tx.stok.update({
        where: { id_merch: item.id_merch },
        data: {
          jumlah_stok: { increment: item.jumlah },
        },
      });

      await deleteEditLogsForTransaksi(item.id_keluar, tx);

      await tx.barangKeluar.delete({
        where: { id_keluar: item.id_keluar },
      });
    }

    for (const path of buktiPaths) {
      await deleteUploadedPublicFile(path);
    }
  });
}

export async function getBarangKeluarSummary() {
  const [totalTransaksiRows, totalBarangKeluar, terpakaiPerMerch] =
    await Promise.all([
    prisma.$queryRaw<{ total: number }[]>`
      SELECT COUNT(DISTINCT COALESCE("id_grup", 'single:' || "id_keluar"::text))::int AS total
      FROM "BarangKeluar"
    `,
    prisma.barangKeluar.aggregate({ _sum: { jumlah: true } }),
    prisma.$queryRaw<{ id_merch: number; total_terpakai: number }[]>`
      SELECT
        id_merch,
        SUM(jumlah + jumlah_kembali)::int AS total_terpakai
      FROM "BarangKeluar"
      GROUP BY id_merch
      ORDER BY total_terpakai DESC
      LIMIT 1
    `,
  ]);

  let merchandiseTerbanyak: { nama: string; total: number } | null = null;

  if (terpakaiPerMerch.length > 0) {
    const top = terpakaiPerMerch[0];
    const merch = await prisma.merchandise.findUnique({
      where: { id_merch: top.id_merch },
      select: { nama_merch: true },
    });

    if (merch) {
      merchandiseTerbanyak = {
        nama: merch.nama_merch,
        total: top.total_terpakai,
      };
    }
  }

  return {
    totalTransaksi: totalTransaksiRows[0]?.total ?? 0,
    totalBarangKeluar: totalBarangKeluar._sum.jumlah ?? 0,
    merchandiseTerbanyak,
  };
}
