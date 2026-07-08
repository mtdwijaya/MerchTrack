"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { buildValueColorMap } from "@/constants/chart-colors";

type ChartItem = {
  label: string;
  total: number;
  isCurrent?: boolean;
};

interface Props {
  data: ChartItem[];
  layout?: "horizontal" | "vertical";
  emptyMessage?: string;
  compactXLabels?: boolean;
}

function getHorizontalBarSize(count: number) {
  if (count <= 3) return 40;
  if (count <= 5) return 25;
  return 20;
}

function getVerticalBarSize(count: number) {
  if (count <= 5) return 90;
  if (count <= 8) return 36;
  if (count <= 12) return 45;
  return 22;
}

function truncateLabel(label: string, max = 14) {
  return label.length > max ? `${label.slice(0, max)}…` : label;
}

export default function DashboardBarChart({
  data,
  layout = "vertical",
  emptyMessage = "Belum ada data",
  compactXLabels = false,
}: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (data.length === 0) {
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

  const chartData = data.map((item) => ({
    name: item.label,
    total: item.total,
    isCurrent: item.isCurrent ?? false,
  }));

  const colorMap = buildValueColorMap(chartData.map((item) => item.total));

  if (layout === "horizontal") {
    const barSize = getHorizontalBarSize(chartData.length);

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
            layout="vertical"
            margin={{ top: 0, right: 16, left: 0, bottom: 5 }}
            barCategoryGap="18%"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="#E8E4DF"
            />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: "#9A9A9A" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={80}
              tick={{ fontSize: 11, fill: "#4A4A4A" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value) => [`${value} pcs`, "Distribusi"]}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid #E8E4DF",
              }}
            />
            <Bar dataKey="total" radius={[0, 5, 5, 0]} barSize={barSize}>
              {chartData.map((_, index) => (
                <Cell key={index} fill={colorMap.get(index) ?? "#D32F2F"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  const barSize = getVerticalBarSize(chartData.length);

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
          margin={{ top: 4, right: 12, left: -8, bottom: compactXLabels ? 12 : 0 }}
          barCategoryGap={compactXLabels ? "12%" : "20%"}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#E8E4DF"
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: compactXLabels ? 9 : 11, fill: "#9A9A9A" }}
            interval={0}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) =>
              truncateLabel(String(value), compactXLabels ? 10 : 14)
            }
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#9A9A9A" }}
            width={40}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value) => [`${value} pcs`, "Jumlah"]}
            labelFormatter={(label) => label}
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid #E8E4DF",
            }}
          />
          <Bar dataKey="total" radius={[8, 8, 0, 0]} barSize={barSize}>
            {chartData.map((_, index) => (
              <Cell key={index} fill={colorMap.get(index) ?? "#D32F2F"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
