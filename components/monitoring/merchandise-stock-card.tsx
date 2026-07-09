import { Badge } from "@/components/ui/badge";
import { stockStatusStyle } from "@/constants/design-tokens";
import type { StockStatus } from "@/lib/monitoring";
import { cn } from "@/lib/utils";

export type MerchandiseStockItem = {
  id_merch: number;
  nama: string;
  jumlah: number;
  status: StockStatus;
};

/** kartu stok kecil di panel monitoring — tinggi natural, ga ditempel stretch */
export default function MerchandiseStockCard({
  item,
}: {
  item: MerchandiseStockItem;
}) {
  const statusStyle = stockStatusStyle[item.status];

  return (
    <article className="rounded-xl border border-[#EFEAE5] bg-[#FAFAFA] p-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 flex-1 truncate text-sm font-medium text-[#1A1C1C]">
          {item.nama}
        </h3>

        <Badge
          variant="secondary"
          className={cn(
            "shrink-0 rounded-sm border-0 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide",
            statusStyle.badge
          )}
        >
          {statusStyle.label}
        </Badge>
      </div>

      <p className="mt-2 text-lg font-bold tabular-nums leading-none text-[#1A1C1C]">
        {item.jumlah.toLocaleString("id-ID")}
        <span className="ml-1 text-xs font-medium text-[#6B7280]">pcs</span>
      </p>
      <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-[#9CA3AF]">
        Stok tersedia
      </p>
    </article>
  );
}
