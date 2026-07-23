import type { JenisDetailTujuan } from "@prisma/client";

export const JENIS_DETAIL_LABEL: Record<JenisDetailTujuan, string> = {
  STASIUN: "Stasiun",
  UNIT: "Unit",
  TEKS: "Custom Text",
  TIDAK_ADA: "Tanpa detail",
};

export function hasTujuanSubList(jenis: JenisDetailTujuan) {
  return jenis === "STASIUN" || jenis === "UNIT";
}

export function getTujuanSubHref(jenis: JenisDetailTujuan) {
  if (jenis === "STASIUN") return "/admin/tujuan/stasiun";
  if (jenis === "UNIT") return "/admin/tujuan/unit";
  return null;
}
