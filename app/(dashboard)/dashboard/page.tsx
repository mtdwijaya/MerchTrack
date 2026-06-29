import { Suspense } from "react";

import { getDashboardData } from "@/lib/dashboard";

import DashboardPageClient from "./dashboard-page-client";

async function DashboardContent() {  const dashboard = await getDashboardData();

  return <DashboardPageClient dashboard={dashboard} />;
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <p className="text-base text-[#444]">Memuat Dashboard...</p>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
