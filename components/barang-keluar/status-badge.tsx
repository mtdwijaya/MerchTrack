"use client";

import type { JenisDetailTujuan, StatusBarangKeluar } from "@prisma/client";

import { statusBarangKeluarStyle } from "@/constants/design-tokens";
import { STATUS_BARANG_KELUAR_LABEL } from "@/lib/detail-tujuan";

const STATUS_STYLE = statusBarangKeluarStyle;

export default function StatusBarangKeluarBadge({
  status,
}: {
  status: StatusBarangKeluar;
}) {
  const style = STATUS_STYLE[status];

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${style}`}
    >
      {STATUS_BARANG_KELUAR_LABEL[status] ?? status}
    </span>
  );
}

export type TujuanOption = {
  id_tujuan: number;
  nama_tujuan: string;
  jenis_detail: JenisDetailTujuan;
  label_detail: string | null;
  boleh_return: boolean;
};
