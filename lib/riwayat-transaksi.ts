import { prisma } from "@/lib/prisma";
import { formatDetailTujuan } from "@/lib/detail-tujuan";
import { formatMerchandiseGroupLabel } from "@/lib/barang-keluar-group";
import type { BarangKeluarRiwayatWithRelations } from "@/lib/barang-keluar-types";
import { asBarangKeluarRiwayatWithRelations } from "@/lib/barang-keluar-types";
import { resolveNamaPetugas } from "@/lib/nama-petugas";
import { riwayatListInclude } from "@/lib/prisma-selects";
import { Prisma } from "@prisma/client";

export type RiwayatSortField =
  | "id_keluar"
  | "tanggal_keluar"
  | "nama_merch"
  | "nama_tujuan"
  | "jumlah";

export type SortOrder = "asc" | "desc";

const SORT_FIELDS: RiwayatSortField[] = [
  "id_keluar",
  "tanggal_keluar",
  "nama_merch",
  "nama_tujuan",
  "jumlah",
];

export function parseRiwayatSort(
  sortBy?: string | null,
  sortOrder?: string | null
): { sortBy: RiwayatSortField; sortOrder: SortOrder } {
  const field = SORT_FIELDS.includes(sortBy as RiwayatSortField)
    ? (sortBy as RiwayatSortField)
    : "tanggal_keluar";

  const order: SortOrder = sortOrder === "asc" ? "asc" : "desc";

  return { sortBy: field, sortOrder: order };
}

function buildOrderBy(
  sortBy: RiwayatSortField,
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

function buildSearchWhere(search?: string): Prisma.BarangKeluarWhereInput {
  if (!search?.trim()) return {};

  const term = search.trim();
  const numericId = Number(term.replace(/^#?TRX-/i, ""));

  const orFilters: Prisma.BarangKeluarWhereInput[] = [
    {
      merchandise: {
        is: {
          nama_merch: {
            contains: term,
            mode: "insensitive",
          },
        },
      },
    },
    {
      tujuan: {
        is: {
          nama_tujuan: {
            contains: term,
            mode: "insensitive",
          },
        },
      },
    },
    {
      stasiun: {
        is: {
          nama_stasiun: {
            contains: term,
            mode: "insensitive",
          },
        },
      },
    },
    {
      unit: {
        is: {
          nama_unit: {
            contains: term,
            mode: "insensitive",
          },
        },
      },
    },
    {
      detail_teks: {
        contains: term,
        mode: "insensitive",
      },
    },
    {
      nama_petugas: {
        contains: term,
        mode: "insensitive",
      },
    },
  ];

  if (!Number.isNaN(numericId)) {
    orFilters.push({ id_keluar: numericId });
  }

  return { OR: orFilters };
}

export async function getRiwayatTransaksiPaginated({
  page,
  limit,
  search,
  sortBy = "tanggal_keluar",
  sortOrder = "desc",
  idTujuan,
  tanggal,
}: {
  page: number;
  limit: number;
  search?: string;
  sortBy?: RiwayatSortField;
  sortOrder?: SortOrder;
  idTujuan?: number;
  tanggal?: string;
}) {
  const skip = (page - 1) * limit;

  const where: Prisma.BarangKeluarWhereInput = {
    ...buildSearchWhere(search),
  };

  if (idTujuan) {
    where.id_tujuan = idTujuan;
  }

  if (tanggal) {
    where.tanggal_keluar = {
      gte: new Date(`${tanggal}T00:00:00`),
      lte: new Date(`${tanggal}T23:59:59`),
    };
  }

  const [data, total] = await Promise.all([
    prisma.barangKeluar.findMany({
      where,
      include: riwayatListInclude,
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

export async function getRiwayatTransaksiSummary() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalTransaksiBulanIni,
    totalBarangKeluar30Hari,
    tujuanTerpopulerGroup,
  ] = await Promise.all([
    prisma.barangKeluar.count({
      where: {
        tanggal_keluar: { gte: startOfMonth },
      },
    }),
    prisma.barangKeluar.aggregate({
      where: {
        tanggal_keluar: { gte: thirtyDaysAgo },
      },
      _sum: { jumlah: true },
    }),
    prisma.barangKeluar.groupBy({
      by: ["id_tujuan"],
      where: {
        tanggal_keluar: { gte: thirtyDaysAgo },
      },
      _count: { id_keluar: true },
      orderBy: {
        _count: { id_keluar: "desc" },
      },
      take: 1,
    }),
  ]);

  let tujuanTerpopuler: {
    nama_tujuan: string;
    totalDistribusi: number;
  } | null = null;

  if (tujuanTerpopulerGroup.length > 0) {
    const tujuan = await prisma.tujuan.findUnique({
      where: {
        id_tujuan: tujuanTerpopulerGroup[0].id_tujuan,
      },
    });

    if (tujuan) {
      tujuanTerpopuler = {
        nama_tujuan: tujuan.nama_tujuan,
        totalDistribusi: tujuanTerpopulerGroup[0]._count.id_keluar,
      };
    }
  }

  return {
    totalTransaksiBulanIni,
    totalBarangKeluar30Hari:
      totalBarangKeluar30Hari._sum.jumlah ?? 0,
    tujuanTerpopuler,
  };
}

export type RiwayatJenis = "KELUAR" | "MASUK" | "RESTOCK";

export type RiwayatUnifiedItem = {
  key: string;
  jenis: RiwayatJenis;
  id: number;
  tanggal: Date;
  merchandise: string;
  jumlah: number;
  total_jenis?: number;
  items?: { id: number; nama_merch: string; jumlah: number }[];
  tujuan?: string;
  info?: string;
  petugas: string;
};

const masukInclude = {
  merchandise: true,
  user: { select: { nama_user: true } },
} as const;

type KeluarWithRelations = BarangKeluarRiwayatWithRelations;

type MasukWithRelations = Prisma.BarangMasukGetPayload<{
  include: typeof masukInclude;
}>;

function buildMasukSearchWhere(search?: string): Prisma.BarangMasukWhereInput {
  if (!search?.trim()) return {};

  const term = search.trim();
  const numericId = Number(term.replace(/^#?TRX-/i, "").replace(/^#?IN-/i, ""));

  const orFilters: Prisma.BarangMasukWhereInput[] = [
    {
      merchandise: {
        is: {
          nama_merch: { contains: term, mode: "insensitive" },
        },
      },
    },
    {
      keterangan: { contains: term, mode: "insensitive" },
    },
    {
      nama_petugas: { contains: term, mode: "insensitive" },
    },
  ];

  if (!Number.isNaN(numericId)) {
    orFilters.push({ id_masuk: numericId });
  }

  return { OR: orFilters };
}

function buildDateRangeFilter(
  tanggalDari?: string,
  tanggalSampai?: string
): { gte?: Date; lte?: Date } | undefined {
  if (!tanggalDari && !tanggalSampai) return undefined;

  const filter: { gte?: Date; lte?: Date } = {};
  if (tanggalDari) {
    filter.gte = new Date(`${tanggalDari}T00:00:00`);
  }
  if (tanggalSampai) {
    filter.lte = new Date(`${tanggalSampai}T23:59:59`);
  } else if (tanggalDari) {
    filter.lte = new Date(`${tanggalDari}T23:59:59`);
  }
  if (tanggalSampai && !tanggalDari) {
    filter.gte = new Date(`${tanggalSampai}T00:00:00`);
  }

  return filter;
}

function mapKeluarToUnified(items: KeluarWithRelations[]): RiwayatUnifiedItem[] {
  const groups = new Map<string, KeluarWithRelations[]>();

  for (const item of items) {
    const row = asBarangKeluarRiwayatWithRelations(item);
    const groupKey = row.id_grup ?? `single:${row.id_keluar}`;
    const existing = groups.get(groupKey) ?? [];
    existing.push(item);
    groups.set(groupKey, existing);
  }

  return [...groups.values()].map((groupItems) => {
    const primary = groupItems.reduce((min, item) =>
      item.id_keluar < min.id_keluar ? item : min
    );
    const merchandiseNames = groupItems.map(
      (item) => item.merchandise.nama_merch
    );
    const totalJumlah = groupItems.reduce(
      (sum, item) => sum + item.jumlah + item.jumlah_kembali,
      0
    );
    const detail = formatDetailTujuan(primary);
    const tujuanNama = primary.tujuan.nama_tujuan;
    const tujuan =
      detail && detail !== "-"
        ? `${tujuanNama} · ${detail}`
        : tujuanNama;

    return {
      key: `keluar-${asBarangKeluarRiwayatWithRelations(primary).id_grup ?? `single-${primary.id_keluar}`}`,
      jenis: "KELUAR" as const,
      id: primary.id_keluar,
      tanggal: groupItems.reduce(
        (latest, item) =>
          item.tanggal_keluar > latest ? item.tanggal_keluar : latest,
        primary.tanggal_keluar
      ),
      merchandise: formatMerchandiseGroupLabel(merchandiseNames),
      total_jenis: groupItems.length,
      jumlah: totalJumlah,
      items: groupItems.map((item) => ({
        id: item.id_keluar,
        nama_merch: item.merchandise.nama_merch,
        jumlah: item.jumlah + item.jumlah_kembali,
      })),
      tujuan,
      info: detail && detail !== "-" ? detail : undefined,
      petugas: resolveNamaPetugas(
        (primary as { nama_petugas?: string | null }).nama_petugas,
        primary.user.nama_user
      ),
    };
  });
}

function mapMasukToUnified(items: MasukWithRelations[]): RiwayatUnifiedItem[] {
  return items.map((item) => {
    const keterangan = item.keterangan?.trim();
    const info = keterangan || "-";

    return {
      key: `${item.jenis === "BARU" ? "masuk" : "restock"}-${item.id_masuk}`,
      jenis: item.jenis === "BARU" ? ("MASUK" as const) : ("RESTOCK" as const),
      id: item.id_masuk,
      tanggal: item.tanggal_masuk,
      merchandise: item.merchandise.nama_merch,
      jumlah: item.jumlah,
      info,
      petugas: resolveNamaPetugas(
        (item as { nama_petugas?: string | null }).nama_petugas,
        item.user.nama_user
      ),
    };
  });
}

export async function getRiwayatUnifiedPaginated({
  page,
  limit,
  search,
  jenis,
  idMerch,
  tanggalDari,
  tanggalSampai,
}: {
  page: number;
  limit: number;
  search?: string;
  jenis?: RiwayatJenis | "";
  idMerch?: number;
  tanggalDari?: string;
  tanggalSampai?: string;
}) {
  const dateFilter = buildDateRangeFilter(tanggalDari, tanggalSampai);
  const merchFilter = idMerch ? { id_merch: idMerch } : {};

  const masukJenisFilter =
    jenis === "MASUK"
      ? { jenis: "BARU" as const }
      : jenis === "RESTOCK"
        ? { jenis: "RESTOCK" as const }
        : {};

  const [keluar, masuk] = await Promise.all([
    jenis === "MASUK" || jenis === "RESTOCK"
      ? Promise.resolve([])
      : prisma.barangKeluar.findMany({
          where: {
            ...buildSearchWhere(search),
            ...merchFilter,
            ...(dateFilter ? { tanggal_keluar: dateFilter } : {}),
          },
          include: riwayatListInclude,
        }),
    jenis === "KELUAR"
      ? Promise.resolve([])
      : prisma.barangMasuk.findMany({
          where: {
            ...buildMasukSearchWhere(search),
            ...merchFilter,
            ...masukJenisFilter,
            ...(dateFilter ? { tanggal_masuk: dateFilter } : {}),
          },
          include: masukInclude,
        }),
  ]);

  const merged = [...mapKeluarToUnified(keluar), ...mapMasukToUnified(masuk)].sort(
    (a, b) => b.tanggal.getTime() - a.tanggal.getTime()
  );

  const total = merged.length;
  const skip = (page - 1) * limit;

  return {
    data: merged.slice(skip, skip + limit),
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getRiwayatUnifiedSummary() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    transaksiKeluarBulanIni,
    transaksiMasukBulanIni,
    totalBarangKeluarBulanIni,
    totalBarangMasukBulanIni,
  ] = await Promise.all([
    prisma.$queryRaw<{ total: number }[]>`
      SELECT COUNT(DISTINCT COALESCE("id_grup", 'single:' || "id_keluar"::text))::int AS total
      FROM "BarangKeluar"
      WHERE "tanggal_keluar" >= ${startOfMonth}
    `,
    prisma.barangMasuk.count({
      where: { tanggal_masuk: { gte: startOfMonth } },
    }),
    prisma.barangKeluar.aggregate({
      where: { tanggal_keluar: { gte: startOfMonth } },
      _sum: { jumlah: true },
    }),
    prisma.barangMasuk.aggregate({
      where: { tanggal_masuk: { gte: startOfMonth } },
      _sum: { jumlah: true },
    }),
  ]);

  return {
    transaksiMasukBulanIni,
    transaksiKeluarBulanIni: transaksiKeluarBulanIni[0]?.total ?? 0,
    totalBarangKeluarBulanIni: totalBarangKeluarBulanIni._sum.jumlah ?? 0,
    totalBarangMasukBulanIni: totalBarangMasukBulanIni._sum.jumlah ?? 0,
  };
}
