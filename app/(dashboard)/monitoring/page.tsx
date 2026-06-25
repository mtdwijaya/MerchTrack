import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getCurrentUser } from "@/lib/auth";
import { getMonitoringOverview } from "@/lib/monitoring-overview";

import MonitoringPageClient from "./monitoring-page-client";

export const revalidate = 30;

// server component: fetch data monitoring lalu kirim ke client untuk tampilan & auto-refresh
export default async function MonitoringPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await getMonitoringOverview(user);

  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-sm text-[#6B7280]">
          Memuat monitoring...
        </div>
      }
    >
      <MonitoringPageClient data={data} role={user.role} />
    </Suspense>
  );
}
