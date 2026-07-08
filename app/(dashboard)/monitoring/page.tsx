import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getCurrentUser } from "@/lib/auth";
import { getAllMerchandiseNames } from "@/lib/merchandise";
import {
  getMonitoringOverview,
  getMonitoringRecentTransactions,
} from "@/lib/monitoring-overview";
import { getAllStasiun } from "@/lib/stasiun";
import { getAllTujuan } from "@/lib/tujuan";
import { getAllUnit } from "@/lib/unit";

import MonitoringPageClient from "./monitoring-page-client";

async function MonitoringContent() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [
    data,
    recentTransactions,
    merchandiseList,
    stasiunList,
    unitList,
    tujuanList,
  ] = await Promise.all([
    getMonitoringOverview(user),
    getMonitoringRecentTransactions(),
    getAllMerchandiseNames(),
    getAllStasiun(),
    getAllUnit(),
    getAllTujuan(),
  ]);

  return (
    <MonitoringPageClient
      data={data}
      recentTransactions={recentTransactions}
      role={user.role}
      merchandiseList={merchandiseList}
      stasiunList={stasiunList}
      unitList={unitList}
      tujuanList={tujuanList}
    />
  );
}

export default function MonitoringPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-sm text-[#6B7280]">
          Memuat monitoring...
        </div>
      }
    >
      <MonitoringContent />
    </Suspense>
  );
}
