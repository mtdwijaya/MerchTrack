import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getCurrentUser } from "@/lib/auth";
import {
  getMonitoringOverview,
  getRecentActivity,
} from "@/lib/monitoring-overview";

import MonitoringPageClient from "./monitoring-page-client";

async function MonitoringContent() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [data, recentActivity] = await Promise.all([
    getMonitoringOverview(user),
    getRecentActivity(user),
  ]);

  return (
    <MonitoringPageClient
      data={data}
      recentActivity={recentActivity}
      role={user.role}
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
