"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { RelativeTime } from "@/components/ui/relative-time";
import {
  activityTypeStyle,
  dashboardLink,
  palette,
} from "@/constants/design-tokens";
import type { RecentActivityItem } from "@/lib/recent-activity";
import { cn } from "@/lib/utils";

const TYPE_STYLES: Record<
  RecentActivityItem["type"],
  { badge: string; dot: string }
> = {
  "Barang Keluar": activityTypeStyle.keluar,
  "Barang Dikembalikan": activityTypeStyle.kembali,
  "Edit Transaksi": activityTypeStyle.edit,
  Restock: activityTypeStyle.restock,
};

function typeLabel(type: RecentActivityItem["type"]) {
  switch (type) {
    case "Barang Keluar":
      return "Keluar";
    case "Barang Dikembalikan":
      return "Kembali";
    case "Edit Transaksi":
      return "Edit";
    case "Restock":
      return "Restock";
  }
}

interface RecentActivityPanelProps {
  items: RecentActivityItem[];
  href?: string;
  className?: string;
}

export default function RecentActivityPanel({
  items,
  href = "/riwayat-transaksi",
  className = "",
}: RecentActivityPanelProps) {
  return (
    <div
      className={`flex h-full flex-col rounded-xl border border-[#E8E4DF] bg-white ${className}`}
    >
      <div className="flex shrink-0 items-center justify-between px-4 pt-3 pb-2">
        <h3
          className="text-sm font-semibold"
          style={{ color: palette.textPrimary }}
        >
          Aktivitas Terbaru
        </h3>
        {href && (
          <Link href={href} className={dashboardLink}>
            Lihat Semua
          </Link>
        )}
      </div>

      <div className="flex flex-1 flex-col px-3 pb-3">
        {items.length === 0 ? (
          <p
            className="flex flex-1 items-center justify-center text-xs"
            style={{ color: palette.textMuted }}
          >
            Belum ada aktivitas
          </p>
        ) : (
          <ul className="flex flex-1 flex-col justify-between gap-1">
            {items.map((item) => {
              const styles = TYPE_STYLES[item.type];

              return (
                <li
                  key={item.id}
                  className="flex items-start gap-2.5 rounded-lg px-1 py-1.5"
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${styles.dot}`}
                    aria-hidden
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className="truncate text-xs font-semibold"
                        style={{ color: palette.textPrimary }}
                      >
                        {item.title}
                      </p>
                      <span
                        className="shrink-0 text-[10px]"
                        style={{ color: palette.textMuted }}
                      >
                        <RelativeTime iso={item.occurredAt} />
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "shrink-0 rounded border-0 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
                          styles.badge
                        )}
                      >
                        {typeLabel(item.type)}
                      </Badge>
                      <p
                        className={`text-[10px] ${
                          item.type === "Edit Transaksi"
                            ? "line-clamp-2"
                            : "truncate"
                        }`}
                        style={{ color: palette.textSecondary }}
                      >
                        {item.meta}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
