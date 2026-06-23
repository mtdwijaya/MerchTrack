import Image from "next/image";

export interface SummaryCardItem {
  title: string;
  value: string | number;
  subtitle?: string;
  suffix?: string;
  iconSrc?: string;
  isTextValue?: boolean;
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
}: SummaryCardItem) {
  return (
    <div className="rounded-2xl border border-[#EFEAE5] bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
            {title}
          </p>

          <div className="mt-3 flex items-end gap-2">
            <h2
              className={
                isTextValue
                  ? "truncate text-2xl font-semibold text-[#1A1C1C]"
                  : "text-3xl font-bold text-[#1A1C1C]"
              }
            >
              {typeof value === "number"
                ? value.toLocaleString("id-ID")
                : value}
            </h2>
            {suffix && (
              <span className="pb-1 text-sm text-[#6B7280]">{suffix}</span>
            )}
          </div>

          {subtitle && (
            <p className="mt-2 text-sm text-[#6B7280]">{subtitle}</p>
          )}
        </div>

        {iconSrc && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF2F2]">
            <Image src={iconSrc} alt="" width={22} height={22} />
          </div>
        )}
      </div>
    </div>
  );
}
