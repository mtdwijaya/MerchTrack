import { Badge } from "@/components/ui/badge";
import { TextOutlineAction } from "@/components/ui/table-actions";
import { stockStatusStyle } from "@/constants/design-tokens";
import type { StockStatus } from "@/lib/monitoring";
import { cn } from "@/lib/utils";
import { Package } from "lucide-react";

export type MerchandiseStockItem = {
  id_merch: number;
  nama: string;
  jumlah: number;
  stokDipakai: number;
  stokSisa: number;
  status: StockStatus;
  foto_path?: string | null;
};

/** kartu stok monitoring — foto kiri + dipakai/sisa + restock */
export default function MerchandiseStockCard({
  item,
  onRestock,
}: {
  item: MerchandiseStockItem;
  onRestock?: (idMerch: number) => void;
}) {
  const statusStyle = stockStatusStyle[item.status];
  const isAlert = item.status === "rendah" || item.status === "habis";

  return (
    <article
      className={cn(
        "rounded-xl border p-3",
        isAlert
          ? "border-[#B1070E]/40 bg-[#FFF5F5]"
          : "border-[#EFEAE5] bg-[#FAFAFA]"
      )}
    >
      <div className="flex gap-3">
        <div
          className={cn(
            "flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border",
            isAlert ? "border-[#F5C2C2] bg-white" : "border-[#E8E4DF] bg-white"
          )}
        >
          {item.foto_path ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.foto_path}
              alt={item.nama}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <Package className="h-6 w-6 text-[#C4C4C4]" aria-hidden />
          )}
        </div>

        <div className="min-w-0 flex-1">
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

          <p
            className={cn(
              "mt-2 text-xl font-bold tabular-nums leading-none",
              isAlert ? "text-[#B01B1C]" : "text-[#1A1C1C]"
            )}
          >
            {item.stokDipakai.toLocaleString("id-ID")}/
            {item.stokSisa.toLocaleString("id-ID")}
            <span className="ml-1 text-xs font-medium text-[#6B7280]">pcs</span>
          </p>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-[#9CA3AF]">
            Dipakai / sisa
          </p>
        </div>
      </div>

      {onRestock && (
        <div className="mt-3">
          <TextOutlineAction
            label="Restock"
            onClick={() => onRestock(item.id_merch)}
          />
        </div>
      )}
    </article>
  );
}
