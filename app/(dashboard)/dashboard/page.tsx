import { Suspense } from "react";

import { getDashboardData } from "@/lib/dashboard";
import { clampDashboardPeriod } from "@/lib/dashboard-constants";
import { getOptionalNumberParam, type SearchParams } from "@/lib/list-params";

import DashboardPageClient from "./dashboard-page-client";

async function DashboardContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const now = new Date();
  const month = getOptionalNumberParam(searchParams, "bulan") ?? now.getMonth() + 1;
  const year =
    getOptionalNumberParam(searchParams, "tahun") ?? now.getFullYear();
  const { month: safeMonth, year: safeYear } = clampDashboardPeriod(
    month,
    year
  );

  const dashboard = await getDashboardData(safeMonth, safeYear);

  return (
    <DashboardPageClient
      dashboard={dashboard}
      selectedMonth={safeMonth}
      selectedYear={safeYear}
    />
  );
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
