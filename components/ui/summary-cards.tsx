import IconImage from "@/components/ui/icon-image";
import { cn } from "@/lib/utils";

export interface SummaryCardItem {
  title: string;
  value: string | number;
  subtitle?: string;
  suffix?: string;
  iconSrc?: string;
  isTextValue?: boolean;
  /** danger = style merah kayak KPI stok rendah di dashboard */
  variant?: "default" | "danger";
}

export default function SummaryCards({
  items,
  columns = 3,
}: {
  items: SummaryCardItem[];
  columns?: 2 | 3 | 4;
}) {
  const gridClass =
    columns === 4
      ? "md:grid-cols-2 xl:grid-cols-4"
      : columns === 2
        ? "md:grid-cols-2"
        : "md:grid-cols-3";

  return (
    <section className={`grid grid-cols-1 gap-5 ${gridClass}`}>
      {items.map((item) => (
        <SummaryCard key={item.title} {...item} />
      ))}
    </section>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  suffix,
  iconSrc,
  isTextValue,
  variant = "default",
}: SummaryCardItem) {
  const isDanger = variant === "danger";

  return (
    <div
      className={cn(
        "rounded-2xl border p-6 shadow-sm",
        isDanger
          ? "border-[#B1070E] bg-[#B01B1C] text-white"
          : "border-[#EFEAE5] bg-white"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-xs font-semibold uppercase tracking-wide",
              isDanger ? "text-white/90" : "text-[#6B7280]"
            )}
          >
            {title}
          </p>

          <div className="mt-3 flex items-end gap-2">
            <h2
              className={cn(
                isTextValue
                  ? "truncate text-2xl font-semibold"
                  : "text-3xl font-bold",
                isDanger ? "text-white" : "text-[#1A1C1C]"
              )}
            >
              {typeof value === "number"
                ? value.toLocaleString("id-ID")
                : value}
            </h2>
            {suffix && (
              <span
                className={cn(
                  "pb-1 text-sm",
                  isDanger ? "text-white/80" : "text-[#6B7280]"
                )}
              >
                {suffix}
              </span>
            )}
          </div>

          {subtitle && (
            <p
              className={cn(
                "mt-2 text-sm",
                isDanger ? "text-white/85" : "text-[#6B7280]"
              )}
            >
              {subtitle}
            </p>
          )}
        </div>

        {iconSrc && (
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
              isDanger ? "bg-white/20" : "bg-[#FFF2F2]"
            )}
          >
            <IconImage
              src={iconSrc}
              size={22}
              className={isDanger ? "brightness-0 invert" : ""}
            />
          </div>
        )}
      </div>
    </div>
  );
}
