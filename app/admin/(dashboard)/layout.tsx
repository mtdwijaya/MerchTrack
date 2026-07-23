import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import {
  ensureDefaultRolePermissions,
  getSidebarMenusForRole,
} from "@/lib/permissions";

import DashboardLayoutClient from "./dashboard-layout-client";

// layout dashboard: cek login di server sebelum render sidebar & halaman anak
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login");
  }

  await ensureDefaultRolePermissions();
  const menus = await getSidebarMenusForRole(user.role);

  return (
    <DashboardLayoutClient user={user} menus={menus}>
      {children}
    </DashboardLayoutClient>
  );
}
