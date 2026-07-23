"use client";

import { useState } from "react";

import Footer from "@/components/layouts/footer";
import Header from "@/components/layouts/header";
import Sidebar from "@/components/layouts/sidebar";
import {
  DashboardUserProvider,
  type DashboardUser,
} from "@/components/providers/dashboard-user";
import type { SidebarMenu } from "@/constants/sidebar-menu";

interface User extends DashboardUser {}

export default function DashboardLayoutClient({
  user,
  menus,
  children,
}: {
  user: User;
  menus: { main: SidebarMenu[]; master: SidebarMenu[] };
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <DashboardUserProvider user={user}>
      <div className="min-h-screen bg-[#F6F7FB]">
      <Sidebar
        user={user}
        menus={menus}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <div
        className={`transition-all duration-300 ${
          collapsed ? "ml-16.5" : "ml-75.5"
        }`}
      >
        <Header user={user} />

        <div className="flex min-h-screen flex-col">
          <main className="flex-1 p-6">{children}</main>
          <Footer />
        </div>
      </div>
      </div>
    </DashboardUserProvider>
  );
}
