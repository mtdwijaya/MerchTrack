"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, CalendarDays } from "lucide-react";

import { MONTH_FULL } from "@/lib/dashboard-constants";

const selectClass =
  "h-8 appearance-none rounded-lg border border-[#E8E4DF] bg-white pl-2.5 pr-7 text-xs font-medium text-[#4A4A4A] outline-none transition focus:border-[#D32F2F]";

export default function DashboardPeriodFilter({
  month,
  year,
}: {
  month: number;
  year: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  function applyPeriod(nextMonth: number, nextYear: number) {
    const params = new URLSearchParams();
    params.set("bulan", String(nextMonth));
    params.set("tahun", String(nextYear));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <div className="flex items-center gap-1.5 text-xs text-[#9A9A9A]">
        <CalendarDays size={14} className="text-[#D32F2F]" />
        <span className="hidden sm:inline">Periode</span>
      </div>

      <div className="relative">
        <select
          value={String(month)}
          onChange={(e) => applyPeriod(Number(e.target.value), year)}
          className={selectClass}
          aria-label="Pilih bulan"
        >
          {MONTH_FULL.map((label, index) => (
            <option key={label} value={String(index + 1)}>
              {label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#9A9A9A]"
        />
      </div>

      <div className="relative">
        <select
          value={String(year)}
          onChange={(e) => applyPeriod(month, Number(e.target.value))}
          className={selectClass}
          aria-label="Pilih tahun"
        >
          {years.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#9A9A9A]"
        />
      </div>
    </div>
  );
}
