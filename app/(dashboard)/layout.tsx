import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";

import DashboardLayoutClient from "./dashboard-layout-client";

// layout dashboard: cek login di server sebelum render sidebar & halaman anak
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardLayoutClient user={user}>{children}</DashboardLayoutClient>
  );
}
