"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CHART_HEIGHT = 300;

type StationDistributionItem = {
  nama: string;
  total: number;
};

export default function StationDistributionChart({
  data,
}: {
  data: StationDistributionItem[];
}) {
  if (data.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-[#6B7280]">
        Belum ada data distribusi
      </p>
    );
  }

  return (
    <div
      className="w-full min-w-0"
      style={{ height: CHART_HEIGHT }}
    >
      <ResponsiveContainer
        width="100%"
        height={CHART_HEIGHT}
      >
        <BarChart data={data}>
          <XAxis dataKey="nama" />
          <YAxis />
          <Tooltip />
          <Bar
            dataKey="total"
            fill="#C62828"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
