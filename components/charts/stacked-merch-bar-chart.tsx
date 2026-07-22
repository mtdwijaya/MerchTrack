"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  buildMerchColorMap,
  sortedMerchKeys,
} from "@/constants/chart-colors";

type MonthBucket = {
  label: string;
  month: number;
  byMerchandise: Record<string, number>;
  isCurrent?: boolean;
};

interface Props {
  data: MonthBucket[];
  emptyMessage?: string;
}

export default function StackedMerchBarChart({
  data,
  emptyMessage = "Belum ada data",
}: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const seriesKeys = useMemo(() => {
    const names: string[] = [];
    for (const row of data) {
      names.push(...Object.keys(row.byMerchandise));
    }
    return sortedMerchKeys(names);
  }, [data]);

  const colorMap = useMemo(
    () => buildMerchColorMap(seriesKeys),
    [seriesKeys]
  );

  const chartData = useMemo(
    () =>
      data.map((row) => ({
        name: row.label,
        ...row.byMerchandise,
      })),
    [data]
  );

  const hasValues = seriesKeys.some((key) =>
    data.some((row) => (row.byMerchandise[key] ?? 0) > 0)
  );

  if (!hasValues) {
    return (
      <div className="flex h-full min-h-[140px] items-center justify-center text-sm text-[#9A9A9A]">
        {emptyMessage}
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="h-full min-h-[140px] w-full animate-pulse rounded-lg bg-[#F3F4F6]" />
    );
  }

  return (
    <div className="h-full min-h-[140px] w-full min-w-0">
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        initialDimension={{ width: 400, height: 180 }}
      >
        <BarChart
          data={chartData}
          margin={{ top: 4, right: 12, left: -8, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#E8E4DF"
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: "#9A9A9A" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#9A9A9A" }}
            width={40}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid #E8E4DF",
            }}
          />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          {seriesKeys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              stackId="merch"
              fill={colorMap.get(key) ?? "#D32F2F"}
              radius={
                index === seriesKeys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]
              }
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
