import type { JenisDetailTujuan } from "@prisma/client";

type DetailFieldInput = {
  id_stasiun?: number | null;
  id_unit?: number | null;
  detail_teks?: string | null;
};

type DetailTujuanDisplay = {
  tujuan: { jenis_detail: JenisDetailTujuan };
  stasiun?: { nama_stasiun: string } | null;
  unit?: { nama_unit: string } | null;
  detail_teks?: string | null;
};

export function validateDetailTujuan(
  tujuan: { jenis_detail: JenisDetailTujuan; label_detail: string | null },
  data: DetailFieldInput
): string | null {
  switch (tujuan.jenis_detail) {
    case "STASIUN":
      if (!data.id_stasiun) {
        return tujuan.label_detail ?? "Stasiun wajib dipilih";
      }
      return null;
    case "UNIT":
      if (!data.id_unit) {
        return tujuan.label_detail ?? "Unit wajib dipilih";
      }
      return null;
    case "TEKS":
      if (!data.detail_teks?.trim()) {
        return tujuan.label_detail ?? "Detail tujuan wajib diisi";
      }
      return null;
    case "TIDAK_ADA":
      return null;
    default:
      return "Jenis detail tujuan tidak valid";
  }
}

export function normalizeDetailTujuan(
  jenis: JenisDetailTujuan,
  data: DetailFieldInput
) {
  return {
    id_stasiun: jenis === "STASIUN" ? data.id_stasiun ?? undefined : undefined,
    id_unit: jenis === "UNIT" ? data.id_unit ?? undefined : undefined,
    detail_teks:
      jenis === "TEKS" ? data.detail_teks?.trim() || undefined : undefined,
  };
}

export function formatDetailTujuan(item: DetailTujuanDisplay): string {
  switch (item.tujuan.jenis_detail) {
    case "STASIUN":
      return item.stasiun?.nama_stasiun ?? "-";
    case "UNIT":
      return item.unit?.nama_unit ?? "-";
    case "TEKS":
      return item.detail_teks?.trim() || "-";
    case "TIDAK_ADA":
      return "-";
    default:
      return "-";
  }
}

export const STATUS_BARANG_KELUAR_LABEL: Record<string, string> = {
  AKTIF: "Diterima",
  SEBAGIAN_KEMBALI: "Sebagian Dikembalikan",
  LUNAS_KEMBALI: "Dikembalikan Semua",
};
