"use client";

import StatusBarangKeluarBadge from "@/components/barang-keluar/status-badge";
import TujuanCell from "@/components/barang-keluar/tujuan-cell";
import { DetailsAction } from "@/components/ui/table-actions";
import { Td } from "@/components/ui/data-table";
import type { BarangKeluarGroupRow } from "@/lib/barang-keluar-group";

type GroupTableRow = Omit<BarangKeluarGroupRow, "tanggal_keluar"> & {
  tanggal_keluar: string | Date;
};

interface BarangKeluarGroupTableRowProps {
  item: GroupTableRow;
  onManage: (id: number) => void;
}

export default function BarangKeluarGroupTableRow({
  item,
  onManage,
}: BarangKeluarGroupTableRowProps) {
  const isMulti = item.total_jenis > 1;

  return (
    <tr className="border-b border-[#EFEAE5] last:border-b-0 hover:bg-gray-50/60">
      <Td variant="numeric" align="left">
        {new Date(item.tanggal_keluar).toLocaleDateString("id-ID")}
      </Td>
      <Td>
        <div className="min-w-0">
          <p className="truncate font-medium text-[#1A1C1C]">
            {item.merchandise_label}
          </p>
          {isMulti && (
            <p className="mt-0.5 text-xs text-[#6B7280]">
              {item.total_jenis} jenis merchandise
            </p>
          )}
        </div>
      </Td>
      <Td variant="numeric" align="center">
        <div>
          <p>{item.total_terpakai.toLocaleString("id-ID")}</p>
          {isMulti && (
            <p className="mt-0.5 text-xs text-[#6B7280]">total terpakai</p>
          )}
        </div>
      </Td>
      <Td>
        <TujuanCell item={item} />
      </Td>
      <Td align="center">
        <StatusBarangKeluarBadge status={item.status} />
      </Td>
      <Td variant="action" align="center">
        <DetailsAction
          label="Kelola"
          variant="manage"
          onClick={() => onManage(item.id_keluar)}
        />
      </Td>
    </tr>
  );
}
