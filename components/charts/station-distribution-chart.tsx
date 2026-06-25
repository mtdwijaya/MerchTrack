"use client";

import { useEffect, useState } from "react";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (data.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-[#6B7280]">
        Belum ada data distribusi
      </p>
    );
  }

  if (!mounted) {
    return (
      <div
        className="w-full min-w-0 animate-pulse rounded-lg bg-[#F3F4F6]"
        style={{ height: CHART_HEIGHT }}
      />
    );
  }

  return (
    <div className="w-full min-w-0" style={{ height: CHART_HEIGHT }}>
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <BarChart data={data}>
          <XAxis dataKey="nama" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="total" fill="#C62828" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
