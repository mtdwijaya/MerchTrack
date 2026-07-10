import type { StatusBarangKeluar } from "@prisma/client";

import { getBarangKeluarQuantities } from "@/lib/barang-keluar-quantities";
import { prisma } from "@/lib/prisma";
import { barangKeluarListInclude } from "@/lib/prisma-selects";
import {
  type BarangKeluarSortField,
  buildSearchWhere,
} from "@/lib/barang-keluar";
import type { SortOrder } from "@/lib/sort";

type SlimRow = {
  id_keluar: number;
  id_grup: string | null;
  tanggal_keluar: Date;
  jumlah: number;
  jumlah_kembali: number;
  status: StatusBarangKeluar;
  merchandise: { nama_merch: string };
  tujuan: { nama_tujuan: string };
};

export type BarangKeluarGroupItem = {
  id_keluar: number;
  nama_merch: string;
  jumlah: number;
  jumlah_kembali: number;
  terpakai: number;
  status: StatusBarangKeluar;
};

export type BarangKeluarGroupRow = {
  group_key: string;
  id_keluar: number;
  id_grup: string | null;
  tanggal_keluar: Date;
  total_terpakai: number;
  total_jenis: number;
  status: StatusBarangKeluar;
  merchandise_label: string;
  items: BarangKeluarGroupItem[];
  jumlah: number;
  jumlah_kembali: number;
  status_raw: StatusBarangKeluar;
  detail_teks: string | null;
  merchandise: { nama_merch: string };
  tujuan: {
    id_tujuan: number;
    nama_tujuan: string;
    jenis_detail: import("@prisma/client").JenisDetailTujuan;
    label_detail: string | null;
    boleh_return: boolean;
  };
  stasiun: { id_stasiun: number; nama_stasiun: string } | null;
  unit: { id_unit: number; nama_unit: string } | null;
  user: { id_user: number; nama_user: string };
};

function getGroupKey(row: Pick<SlimRow, "id_keluar" | "id_grup">) {
  return row.id_grup ?? `single:${row.id_keluar}`;
}

export function aggregateGrupStatus(
  statuses: StatusBarangKeluar[]
): StatusBarangKeluar {
  if (statuses.length === 0) return "AKTIF";
  if (statuses.every((status) => status === "LUNAS_KEMBALI")) {
    return "LUNAS_KEMBALI";
  }
  if (statuses.every((status) => status === "AKTIF")) {
    return "AKTIF";
  }
  return "SEBAGIAN_KEMBALI";
}

export function formatMerchandiseGroupLabel(names: string[]) {
  const unique = [...new Set(names)];
  if (unique.length === 0) return "-";
  if (unique.length === 1) return unique[0];
  if (unique.length === 2) return `${unique[0]}, ${unique[1]}`;
  return `${unique[0]}, ${unique[1]} +${unique.length - 2} lainnya`;
}

function buildGroupSummaries(rows: SlimRow[]) {
  const map = new Map<
    string,
    {
      group_key: string;
      id_keluar: number;
      id_grup: string | null;
      tanggal_keluar: Date;
      total_terpakai: number;
      merchandise_names: string[];
      statuses: StatusBarangKeluar[];
      sort_merch: string;
      sort_tujuan: string;
      sort_jumlah: number;
      item_ids: number[];
    }
  >();

  for (const row of rows) {
    const group_key = getGroupKey(row);
    const qty = getBarangKeluarQuantities(row.jumlah, row.jumlah_kembali);
    const existing = map.get(group_key);

    if (!existing) {
      map.set(group_key, {
        group_key,
        id_keluar: row.id_keluar,
        id_grup: row.id_grup,
        tanggal_keluar: row.tanggal_keluar,
        total_terpakai: qty.terpakai,
        merchandise_names: [row.merchandise.nama_merch],
        statuses: [row.status],
        sort_merch: row.merchandise.nama_merch,
        sort_tujuan: row.tujuan.nama_tujuan,
        sort_jumlah: qty.terpakai,
        item_ids: [row.id_keluar],
      });
      continue;
    }

    existing.total_terpakai += qty.terpakai;
    existing.merchandise_names.push(row.merchandise.nama_merch);
    existing.statuses.push(row.status);
    existing.sort_jumlah += qty.terpakai;
    existing.item_ids.push(row.id_keluar);

    if (row.id_keluar < existing.id_keluar) {
      existing.id_keluar = row.id_keluar;
    }

    if (sortByTanggal(row.tanggal_keluar, existing.tanggal_keluar) > 0) {
      existing.tanggal_keluar = row.tanggal_keluar;
    }
  }

  return [...map.values()];
}

function sortByTanggal(a: Date, b: Date) {
  return a.getTime() - b.getTime();
}

function sortGroups(
  groups: ReturnType<typeof buildGroupSummaries>,
  sortBy: BarangKeluarSortField,
  sortOrder: SortOrder
) {
  const direction = sortOrder === "asc" ? 1 : -1;

  groups.sort((a, b) => {
    switch (sortBy) {
      case "nama_merch":
        return a.sort_merch.localeCompare(b.sort_merch, "id") * direction;
      case "nama_tujuan":
        return a.sort_tujuan.localeCompare(b.sort_tujuan, "id") * direction;
      case "jumlah":
        return (a.sort_jumlah - b.sort_jumlah) * direction;
      case "id_keluar":
        return (a.id_keluar - b.id_keluar) * direction;
      default:
        return sortByTanggal(a.tanggal_keluar, b.tanggal_keluar) * direction;
    }
  });
}

export async function getBarangKeluarGroupedPaginated({
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

  const where = {
    ...buildSearchWhere(search),
    ...(idTujuan ? { id_tujuan: idTujuan } : {}),
  };

  const slimRows = await prisma.barangKeluar.findMany({
    where,
    select: {
      id_keluar: true,
      id_grup: true,
      tanggal_keluar: true,
      jumlah: true,
      jumlah_kembali: true,
      status: true,
      merchandise: { select: { nama_merch: true } },
      tujuan: { select: { nama_tujuan: true } },
    },
    orderBy: { tanggal_keluar: "desc" },
  });

  const groups = buildGroupSummaries(slimRows);
  sortGroups(groups, sortBy, sortOrder);

  const total = groups.length;
  const pageGroups = groups.slice(skip, skip + limit);

  if (pageGroups.length === 0) {
    return {
      data: [] as BarangKeluarGroupRow[],
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  const keluarIds = pageGroups.flatMap((group) => group.item_ids);

  const fullRows = await prisma.barangKeluar.findMany({
    where: { id_keluar: { in: keluarIds } },
    include: barangKeluarListInclude,
    orderBy: { id_keluar: "asc" },
  });

  const rowById = new Map(fullRows.map((row) => [row.id_keluar, row]));

  const data: BarangKeluarGroupRow[] = pageGroups.map((group) => {
    const items = group.item_ids
      .map((id) => rowById.get(id))
      .filter((row): row is NonNullable<typeof row> => row != null)
      .map((row) => {
        const qty = getBarangKeluarQuantities(row.jumlah, row.jumlah_kembali);
        return {
          id_keluar: row.id_keluar,
          nama_merch: row.merchandise.nama_merch,
          jumlah: row.jumlah,
          jumlah_kembali: row.jumlah_kembali,
          terpakai: qty.terpakai,
          status: row.status,
        };
      });

    const header = rowById.get(group.id_keluar) ?? fullRows[0];
    const merchandise_label = formatMerchandiseGroupLabel(
      group.merchandise_names
    );

    return {
      group_key: group.group_key,
      id_keluar: group.id_keluar,
      id_grup: group.id_grup,
      tanggal_keluar: group.tanggal_keluar,
      total_terpakai: group.total_terpakai,
      total_jenis: items.length,
      status: aggregateGrupStatus(group.statuses),
      merchandise_label,
      items,
      jumlah: items.reduce((sum, item) => sum + item.jumlah, 0),
      jumlah_kembali: items.reduce((sum, item) => sum + item.jumlah_kembali, 0),
      status_raw: header.status,
      detail_teks: header.detail_teks,
      merchandise: { nama_merch: merchandise_label },
      tujuan: header.tujuan,
      stasiun: header.stasiun,
      unit: header.unit,
      user: header.user,
    };
  });

  return {
    data,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit) || 1,
  };
}
