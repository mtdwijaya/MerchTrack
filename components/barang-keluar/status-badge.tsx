"use client";

import type { JenisDetailTujuan, StatusBarangKeluar } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { statusBarangKeluarStyle } from "@/constants/design-tokens";
import { STATUS_BARANG_KELUAR_LABEL } from "@/lib/detail-tujuan";
import { cn } from "@/lib/utils";

// badge status transaksi barang keluar — warna dari design token
export default function StatusBarangKeluarBadge({
  status,
}: {
  status: StatusBarangKeluar;
}) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "rounded-full border-0 px-2.5 py-1 text-xs font-medium",
        statusBarangKeluarStyle[status]
      )}
    >
      {STATUS_BARANG_KELUAR_LABEL[status] ?? status}
    </Badge>
  );
}

export type TujuanOption = {
  id_tujuan: number;
  nama_tujuan: string;
  jenis_detail: JenisDetailTujuan;
  label_detail: string | null;
  boleh_return: boolean;
};
