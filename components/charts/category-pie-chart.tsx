"use client";

import { useEffect, useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { getPieColorByValueRank } from "@/constants/chart-colors";

type CategoryItem = {
  nama: string;
  total: number;
};

function CategoryTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload: CategoryItem }[];
}) {
  if (!active || !payload?.length) return null;

  const item = payload[0];

  return (
    <div className="rounded-lg border border-[#E8E4DF] bg-white px-3 py-2 shadow-sm">
      <p className="text-xs font-semibold text-[#1A1A1A]">{item.name}</p>
      <p className="mt-0.5 text-xs text-[#9A9A9A]">
        {item.value.toLocaleString("id-ID")} pcs
      </p>
    </div>
  );
}

export default function CategoryPieChart({ data }: { data: CategoryItem[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalAll = data.reduce((sum, item) => sum + item.total, 0);

  const ranked = [...data]
    .map((item, index) => ({ index, total: item.total }))
    .sort((a, b) => b.total - a.total);
  const colorByIndex = new Map<number, string>();
  ranked.forEach((item, rank) => {
    colorByIndex.set(
      item.index,
      getPieColorByValueRank(rank, data.length)
    );
  });

  if (data.length === 0) {
    return (
      <div className="flex h-full min-h-[140px] items-center justify-center text-sm text-[#9A9A9A]">
        Belum ada data tujuan
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="h-full min-h-[140px] w-full animate-pulse rounded-lg bg-[#F3F4F6]" />
    );
  }

  return (
    <div className="flex h-full min-h-[140px] items-stretch gap-2">
      <div className="relative min-h-0 min-w-0 flex-[1.35]">
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
          initialDimension={{ width: 200, height: 140 }}
        >
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="nama"
              cx="50%"
              cy="50%"
              innerRadius="52%"
              outerRadius="78%"
              paddingAngle={2}
            >
              {data.map((_, index) => (
                <Cell
                  key={index}
                  fill={colorByIndex.get(index) ?? "#D32F2F"}
                />
              ))}
            </Pie>
            <Tooltip content={<CategoryTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xl font-bold text-[#1A1A1A]">
            {totalAll.toLocaleString("id-ID")}
          </p>
          <p className="text-[10px] text-[#9A9A9A]">Total Distribusi</p>
        </div>
      </div>

      <ul className="min-w-0 flex-1 space-y-1.5 self-center">
        {data.map((item, index) => (
          <li key={item.nama} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{
                backgroundColor: colorByIndex.get(index) ?? "#D32F2F",
              }}
            />
            <div className="min-w-0">
              <p className="truncate text-[11px] font-medium text-[#4A4A4A]">
                {item.nama}
              </p>
              <p className="text-[10px] text-[#9A9A9A]">
                {item.total.toLocaleString("id-ID")} pcs
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
