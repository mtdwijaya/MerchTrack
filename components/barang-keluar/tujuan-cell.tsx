import type { JenisDetailTujuan } from "@prisma/client";

import { formatDetailTujuan } from "@/lib/detail-tujuan";

interface TujuanCellItem {
  tujuan: { nama_tujuan: string; jenis_detail: JenisDetailTujuan };
  stasiun: { nama_stasiun: string } | null;
  unit: { nama_unit: string } | null;
  detail_teks: string | null;
}

export default function TujuanCell({ item }: { item: TujuanCellItem }) {
  const detail = formatDetailTujuan(item);
  const hasDetail = detail && detail !== "-";

  return (
    <div className="min-w-0">
      <p className="truncate font-medium text-[#1A1C1C]">
        {item.tujuan.nama_tujuan}
      </p>
      {hasDetail && (
        <p className="mt-0.5 truncate text-xs text-[#6B7280]">{detail}</p>
      )}
    </div>
  );
}
