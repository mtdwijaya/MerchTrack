import { Suspense } from "react";

import { getDashboardData } from "@/lib/dashboard";
import { clampDashboardPeriod } from "@/lib/dashboard-constants";
import { getOptionalNumberParam, type SearchParams } from "@/lib/list-params";

import DashboardPageClient from "./dashboard-page-client";

export const dynamic = "force-dynamic";

async function DashboardContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const now = new Date();
  const chartYearRaw =
    getOptionalNumberParam(searchParams, "chartTahun") ?? now.getFullYear();
  const { year: chartYear } = clampDashboardPeriod(1, chartYearRaw);

  const sankeyBulan = getOptionalNumberParam(searchParams, "sankeyBulan");
  const sankeyTahun = getOptionalNumberParam(searchParams, "sankeyTahun");

  const dashboard = await getDashboardData({
    chartYear,
    sankeyMonth: sankeyBulan ?? null,
    sankeyYear: sankeyTahun ?? null,
  });

  return <DashboardPageClient dashboard={dashboard} />;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <p className="text-base text-[#444]">Memuat Dashboard...</p>
        </div>
      }
    >
      <DashboardContent searchParams={params} />
    </Suspense>
  );
}
