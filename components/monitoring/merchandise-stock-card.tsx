import { stockStatusStyle } from "@/constants/design-tokens";
import type { StockStatus } from "@/lib/monitoring";
import { cn } from "@/lib/utils";

export type MerchandiseStockItem = {
  id_merch: number;
  nama: string;
  jumlah: number;
  status: StockStatus;
};

/** kartu stok per merchandise — selaras panel monitoring & summary cards */
export default function MerchandiseStockCard({
  item,
  compact = false,
}: {
  item: MerchandiseStockItem;
  compact?: boolean;
}) {
  const statusStyle = stockStatusStyle[item.status];

  return (
    <article
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-[#EFEAE5] bg-[#FAFAFA]",
        compact ? "p-2.5" : "p-4"
      )}
    >
      <div className="flex min-h-0 items-start justify-between gap-2">
        <h3
          className={cn(
            "min-w-0 flex-1 line-clamp-2 font-semibold leading-snug text-[#1A1C1C]",
            compact ? "text-sm" : "text-sm"
          )}
        >
          {item.nama}
        </h3>

        <span
          className={cn(
            "shrink-0 rounded-sm px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide",
            statusStyle.badge
          )}
        >
          {statusStyle.label}
        </span>
      </div>

      <div className={cn("mt-auto", compact ? "pt-2" : "pt-4")}>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">
          Stok Tersedia
        </p>
        <p
          className={cn(
            "mt-0.5 font-bold tabular-nums text-[#1A1C1C]",
            compact ? "text-base" : "text-xl"
          )}
        >
          {item.jumlah.toLocaleString("id-ID")}
          <span className="ml-1 text-xs font-medium text-[#6B7280]">pcs</span>
        </p>
      </div>
    </article>
  );
}
