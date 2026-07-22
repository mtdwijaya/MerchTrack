"use client";

import StatusBarangKeluarBadge from "@/components/barang-keluar/status-badge";
import TujuanCell from "@/components/barang-keluar/tujuan-cell";
import { DetailsAction, TextOutlineAction } from "@/components/ui/table-actions";
import { Td } from "@/components/ui/data-table";
import { formatTransaksiDate } from "@/lib/format-transaksi";
import type { BarangKeluarGroupRow } from "@/lib/barang-keluar-group";
import { cn } from "@/lib/utils";

type GroupTableRow = Omit<BarangKeluarGroupRow, "tanggal_keluar"> & {
  tanggal_keluar: string | Date;
};

interface BarangKeluarGroupTableRowProps {
  item: GroupTableRow;
  onManage: (id: number) => void;
  /** Satu tombol untuk seluruh grup — buka form batch */
  onReturn?: (groupIdKeluar: number) => void;
}

function groupCanReturn(group: GroupTableRow) {
  if (!group.tujuan.boleh_return) return false;
  return group.items.some(
    (line) => line.jumlah > line.jumlah_kembali && line.status !== "LUNAS_KEMBALI"
  );
}

function multiGridClass(isMulti: boolean, isSpan = false) {
  if (!isMulti) return undefined;
  return cn("border border-[#E5E7EB]", isSpan && "bg-[#FAFAFA]/30");
}

/**
 * Multi-merch: waktu/tujuan/status/aksi di-rowSpan (tengah).
 * Kembalikan 1x per grup → form batch.
 */
export default function BarangKeluarGroupTableRow({
  item,
  onManage,
  onReturn,
}: BarangKeluarGroupTableRowProps) {
  const lines =
    item.items.length > 0
      ? item.items
      : [
          {
            id_keluar: item.id_keluar,
            nama_merch: item.merchandise_label,
            jumlah: item.jumlah,
            jumlah_kembali: item.jumlah_kembali,
            terpakai: item.total_terpakai,
            status: item.status,
          },
        ];

  const isMulti = lines.length > 1;
  const rowSpan = lines.length;
  const showReturn = Boolean(onReturn && groupCanReturn(item));

  return (
    <>
      {lines.map((line, index) => {
        const isFirst = index === 0;
        const isLast = index === lines.length - 1;

        return (
          <tr
            key={`${item.group_key}-${line.id_keluar}`}
            className={cn(
              "hover:bg-gray-50/60",
              (!isMulti || isLast) && "border-b border-[#EFEAE5] last:border-b-0"
            )}
          >
            {isFirst && (
              <Td
                variant="numeric"
                align="center"
                rowSpan={rowSpan}
                className={cn(
                  "align-middle whitespace-nowrap",
                  multiGridClass(isMulti, true)
                )}
              >
                {formatTransaksiDate(item.tanggal_keluar)}
              </Td>
            )}

            <Td align="center" className={multiGridClass(isMulti)}>
              <p className="truncate font-medium text-[#1A1C1C]">
                {line.nama_merch}
              </p>
            </Td>

            <Td
              variant="numeric"
              align="center"
              className={multiGridClass(isMulti)}
            >
              {line.terpakai.toLocaleString("id-ID")}
            </Td>

            {isFirst && (
              <Td
                align="center"
                rowSpan={rowSpan}
                className={cn("align-middle", multiGridClass(isMulti, true))}
              >
                <div className="flex justify-center">
                  <TujuanCell item={item} align="center" />
                </div>
              </Td>
            )}

            {isFirst && (
              <Td
                align="center"
                rowSpan={rowSpan}
                className={cn("align-middle", multiGridClass(isMulti, true))}
              >
                <StatusBarangKeluarBadge status={item.status} />
              </Td>
            )}

            {isFirst && (
              <Td
                variant="action"
                align="center"
                rowSpan={rowSpan}
                className={cn("align-middle", multiGridClass(isMulti, true))}
              >
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {showReturn && (
                    <TextOutlineAction
                      label="Kembalikan"
                      onClick={() => onReturn?.(item.id_keluar)}
                    />
                  )}
                  <DetailsAction
                    label="Detail"
                    variant="manage"
                    onClick={() => onManage(item.id_keluar)}
                  />
                </div>
              </Td>
            )}
          </tr>
        );
      })}
    </>
  );
}
