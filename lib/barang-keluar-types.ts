import type { Prisma } from "@prisma/client";

import { barangKeluarListInclude, riwayatListInclude } from "@/lib/prisma-selects";

type BarangKeluarListPayload = Prisma.BarangKeluarGetPayload<{
  include: typeof barangKeluarListInclude;
}>;

type BarangKeluarRiwayatPayload = Prisma.BarangKeluarGetPayload<{
  include: typeof riwayatListInclude;
}>;

/** Pastikan field grup tersedia meski Prisma client di IDE belum di-refresh. */
export type BarangKeluarWithRelations = BarangKeluarListPayload & {
  id_grup?: string | null;
};

export type BarangKeluarRiwayatWithRelations = BarangKeluarRiwayatPayload & {
  id_grup?: string | null;
};

export type BarangKeluarCreateData = {
  id_grup?: string | null;
  id_merch: number;
  id_tujuan: number;
  id_user: number;
  id_stasiun?: number | null;
  id_unit?: number | null;
  detail_teks?: string | null;
  jumlah: number;
  jumlah_kembali?: number;
  status?: Prisma.BarangKeluarUncheckedCreateInput["status"];
  tanggal_keluar?: Date | string;
  dicatat_pada?: Date | string;
  keterangan?: string | null;
  bukti_path?: string | null;
  bukti_nama?: string | null;
};

export function asBarangKeluarWithRelations(
  row: unknown
): BarangKeluarWithRelations {
  return row as BarangKeluarWithRelations;
}

export function asBarangKeluarWithRelationsList(
  rows: unknown
): BarangKeluarWithRelations[] {
  return rows as BarangKeluarWithRelations[];
}

export function asBarangKeluarRiwayatWithRelations(
  row: unknown
): BarangKeluarRiwayatWithRelations {
  return row as BarangKeluarRiwayatWithRelations;
}
