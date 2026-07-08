import { Suspense } from "react";

import { getCurrentUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { clampDashboardPeriod } from "@/lib/dashboard-constants";
import { getOptionalNumberParam, type SearchParams } from "@/lib/list-params";
import { getRecentActivity } from "@/lib/recent-activity";

import DashboardPageClient from "./dashboard-page-client";

export const dynamic = "force-dynamic";

async function DashboardContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getCurrentUser();
  const now = new Date();
  const month = getOptionalNumberParam(searchParams, "bulan") ?? now.getMonth() + 1;
  const year =
    getOptionalNumberParam(searchParams, "tahun") ?? now.getFullYear();
  const { month: safeMonth, year: safeYear } = clampDashboardPeriod(
    month,
    year
  );

  const [dashboard, recentActivity] = await Promise.all([
    getDashboardData(safeMonth, safeYear),
    user
      ? getRecentActivity({
          id_user: user.id_user,
          id_stasiun: user.id_stasiun,
          role: user.role,
        })
      : Promise.resolve([]),
  ]);

  return (
    <DashboardPageClient
      dashboard={dashboard}
      recentActivity={recentActivity}
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
