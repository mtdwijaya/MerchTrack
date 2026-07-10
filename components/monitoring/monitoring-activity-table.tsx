"use client";

import { Badge } from "@/components/ui/badge";
import {
  DataTable,
  TableEmptyRow,
  Td,
  Th,
} from "@/components/ui/data-table";
import { RelativeTime } from "@/components/ui/relative-time";
import { DetailsAction } from "@/components/ui/table-actions";
import { activityTypeStyle } from "@/constants/design-tokens";
import type { RecentActivityItem } from "@/lib/recent-activity";
import { cn } from "@/lib/utils";

const TYPE_STYLES: Record<
  RecentActivityItem["type"],
  { badge: string; label: string }
> = {
  "Barang Keluar": { badge: activityTypeStyle.keluar.badge, label: "Keluar" },
  "Barang Dikembalikan": {
    badge: activityTypeStyle.kembali.badge,
    label: "Kembali",
  },
  "Edit Transaksi": { badge: activityTypeStyle.edit.badge, label: "Edit" },
  Restock: { badge: activityTypeStyle.restock.badge, label: "Restock" },
};

interface MonitoringActivityTableProps {
  items: RecentActivityItem[];
  loading?: boolean;
  onOpenDetail?: (id: number) => void;
}

export default function MonitoringActivityTable({
  items,
  loading,
  onOpenDetail,
}: MonitoringActivityTableProps) {
  return (
    <DataTable>
      <thead>
        <tr className="border-b border-[#EFEAE5] bg-[#FAFAFA]">
          <Th>Waktu</Th>
          <Th>Jenis</Th>
          <Th>Aktivitas</Th>
          <Th>Detail</Th>
          <Th align="center">Aksi</Th>
        </tr>
      </thead>
      <tbody>
        {loading ? (
          <TableEmptyRow colSpan={5} message="Memuat data..." />
        ) : items.length === 0 ? (
          <TableEmptyRow colSpan={5} message="Belum ada aktivitas" />
        ) : (
          items.map((item) => {
            const styles = TYPE_STYLES[item.type];

            return (
              <tr
                key={item.id}
                className="border-b border-[#EFEAE5] last:border-b-0 hover:bg-gray-50/60"
              >
                <Td variant="numeric" align="left" className="whitespace-nowrap">
                  <RelativeTime iso={item.occurredAt} />
                </Td>
                <Td>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "rounded border-0 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      styles.badge
                    )}
                  >
                    {styles.label}
                  </Badge>
                </Td>
                <Td variant="truncate" className="max-w-[220px] font-medium">
                  {item.title}
                </Td>
                <Td
                  variant="truncate"
                  className={`max-w-[280px] text-[#6B7280] ${
                    item.type === "Edit Transaksi" ? "whitespace-normal" : ""
                  }`}
                >
                  {item.meta}
                </Td>
                <Td variant="action" align="center">
                  {item.detailId && onOpenDetail ? (
                    <DetailsAction onClick={() => onOpenDetail(item.detailId!)} />
                  ) : (
                    <span className="text-xs text-[#9CA3AF]">—</span>
                  )}
                </Td>
              </tr>
            );
          })
        )}
      </tbody>
    </DataTable>
  );
}
