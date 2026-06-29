import { Suspense } from "react";
import { getDashboardData } from "@/lib/dashboard";

import DashboardPageClient from "./dashboard-page-client";

export const revalidate = 60;

// server component: ambil statistik dashboard lalu render chart di client
export default async function DashboardPage() {
  const dashboard = await getDashboardData();

  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <p className="text-base text-[#444]">Memuat Dashboard...</p>
        </div>
      }
    >
      <DashboardPageClient dashboard={dashboard} />
    </Suspense>
  );
}
 