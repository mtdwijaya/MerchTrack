"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        router.push("/login");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="text-2xl font-bold text-[#D71920]">MT</div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <NavItem
            icon="📊"
            label="Dashboard"
            href="/dashboard"
            open={sidebarOpen}
          />
          <NavItem
            icon="📦"
            label="Merchandise"
            href="/dashboard/merchandise"
            open={sidebarOpen}
          />
          <NavItem
            icon="📤"
            label="Barang Keluar"
            href="/dashboard/barang-keluar"
            open={sidebarOpen}
          />
          <NavItem
            icon="📋"
            label="Riwayat Transaksi"
            href="/dashboard/riwayat-transaksi"
            open={sidebarOpen}
          />
          <NavItem
            icon="🏢"
            label="Stasiun"
            href="/dashboard/stasiun"
            open={sidebarOpen}
          />
          <NavItem
            icon="👁️"
            label="Monitoring"
            href="/dashboard/monitoring"
            open={sidebarOpen}
          />
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition ${
              !sidebarOpen && "justify-center"
            }`}
          >
            <span>🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
            >
              ☰
            </button>
            <h1 className="text-xl font-semibold text-gray-800">
              MerchTrack
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">👤 Admin User</div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
    </div>
  );
}

function NavItem({
  icon,
  label,
  href,
  open,
}: {
  icon: string;
  label: string;
  href: string;
  open: boolean;
}) {
  return (
    <a
      href={href}
      className={`flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition ${
        !open && "justify-center"
      }`}
    >
      <span className="text-lg">{icon}</span>
      {open && <span className="text-sm font-medium">{label}</span>}
    </a>
  );
}
