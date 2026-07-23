"use client";

import StatusBarangKeluarBadge from "@/components/barang-keluar/status-badge";
import TujuanCell from "@/components/barang-keluar/tujuan-cell";
import { DetailsAction, TextOutlineAction } from "@/components/ui/table-actions";
import { Td } from "@/components/ui/data-table";
import { transactionStripeRowClass } from "@/constants/table-styles";
import { formatTransaksiDate } from "@/lib/format-transaksi";
import type { BarangKeluarGroupRow } from "@/lib/barang-keluar-group";

type GroupTableRow = Omit<BarangKeluarGroupRow, "tanggal_keluar"> & {
  tanggal_keluar: string | Date;
};

interface BarangKeluarGroupTableRowProps {
  item: GroupTableRow;
  onManage: (id: number) => void;
  /** Satu tombol untuk seluruh grup — buka form batch */
  onReturn?: (groupIdKeluar: number) => void;
  /** Index transaksi di halaman (untuk zebra per grup) */
  stripeIndex?: number;
}

function groupCanReturn(group: GroupTableRow) {
  if (!group.tujuan.boleh_return) return false;
  return group.items.some(
    (line) =>
      line.jumlah > line.jumlah_kembali && line.status !== "LUNAS_KEMBALI"
  );
}

/**
 * Multi-merch: waktu/tujuan/status/aksi di-rowSpan (tengah).
 * Zebra & grid border per transaksi — hover tanpa hilangkan garis.
 */
export default function BarangKeluarGroupTableRow({
  item,
  onManage,
  onReturn,
  stripeIndex = 0,
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

  const rowSpan = lines.length;
  const showReturn = Boolean(onReturn && groupCanReturn(item));
  const stripeRow = transactionStripeRowClass(stripeIndex);

  return (
    <>
      {lines.map((line, index) => {
        const isFirst = index === 0;

        return (
          <tr
            key={`${item.group_key}-${line.id_keluar}`}
            className={stripeRow}
          >
            {isFirst && (
              <Td
                variant="numeric"
                align="center"
                rowSpan={rowSpan}
                className="align-middle whitespace-nowrap"
              >
                {formatTransaksiDate(item.tanggal_keluar)}
              </Td>
            )}

            <Td align="center">
              <p className="truncate font-medium text-[#1A1C1C]">
                {line.nama_merch}
              </p>
            </Td>

            <Td variant="numeric" align="center">
              {line.terpakai.toLocaleString("id-ID")}
            </Td>

            {isFirst && (
              <Td align="center" rowSpan={rowSpan} className="align-middle">
                <div className="flex justify-center">
                  <TujuanCell item={item} align="center" />
                </div>
              </Td>
            )}

            {isFirst && (
              <Td align="center" rowSpan={rowSpan} className="align-middle">
                <StatusBarangKeluarBadge status={item.status} />
              </Td>
            )}

            {isFirst && (
              <Td align="center" rowSpan={rowSpan} className="align-middle">
                <p className="truncate font-medium text-[#1A1C1C]">
                  {item.petugas}
                </p>
              </Td>
            )}

            {isFirst && (
              <Td
                variant="action"
                align="center"
                rowSpan={rowSpan}
                className="align-middle"
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
