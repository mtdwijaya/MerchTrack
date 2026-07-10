import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getCurrentUser } from "@/lib/auth";
import { getAllMerchandiseNames } from "@/lib/merchandise";
import { getMonitoringOverview } from "@/lib/monitoring-overview";
import { getActivityPaginated } from "@/lib/recent-activity";
import { getAllStasiun } from "@/lib/stasiun";
import { getAllTujuan } from "@/lib/tujuan";
import { getAllUnit } from "@/lib/unit";

import MonitoringPageClient from "./monitoring-page-client";

const PAGE_SIZE = 10;

async function MonitoringContent({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const page = Number(params.page || "1");

  const monitoringUser = {
    id_user: user.id_user,
    id_stasiun: user.id_stasiun,
    role: user.role,
  };

  const [
    data,
    activityList,
    merchandiseList,
    stasiunList,
    unitList,
    tujuanList,
  ] = await Promise.all([
    getMonitoringOverview(monitoringUser),
    getActivityPaginated(monitoringUser, page, PAGE_SIZE),
    getAllMerchandiseNames(),
    getAllStasiun(),
    getAllUnit(),
    getAllTujuan(),
  ]);

  return (
    <MonitoringPageClient
      data={data}
      activityList={activityList}
      pageSize={PAGE_SIZE}
      role={user.role}
      merchandiseList={merchandiseList}
      stasiunList={stasiunList}
      unitList={unitList}
      tujuanList={tujuanList}
    />
  );
}

export default function MonitoringPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-sm text-[#6B7280]">
          Memuat monitoring...
        </div>
      }
    >
      <MonitoringContent searchParams={searchParams} />
    </Suspense>
  );
}
