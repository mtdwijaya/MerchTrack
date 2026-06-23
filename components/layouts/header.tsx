"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface User {
  id_user: number;
  nama_user: string;
  email: string;
  role: string;
}

interface HeaderProps {
  user: User | null;
}

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/barang-keluar": "Barang Keluar",
  "/barang-masuk": "Barang Masuk",
  "/monitoring": "Monitoring",
  "/history": "History",
  "/stasiun": "Manajemen Stasiun",
  "/merchandise": "Manajemen Merchandise",
  "/pengguna": "Manajemen Pengguna",
  "/riwayat-transaksi": "Riwayat Transaksi",
};

export default function Header({
  user,
}: HeaderProps) {
  const pathname = usePathname();

  const currentPage =
    Object.entries(pageTitles).find(([path]) =>
      pathname.startsWith(path)
    )?.[1] || "Dashboard";

  const isDashboard =
    pathname === "/dashboard";

  return (
    <header
      className="
        sticky
        top-0
        z-40
        h-15
        bg-white
        border-b
        border-[#E5E7EB]
        px-7
        flex
        items-center
        justify-between
      "
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[11px] font-medium ">
        <Link
          href="/dashboard"
          className="
            text-[#4B5563]
            hover:text-[#B1070E]
            transition
          "
        >
          Dashboard
        </Link>

        {!isDashboard && (
          <>
            <span className="text-[#9CA3AF]">
              ›
            </span>

            <span className="font-semibold text-[#B1070E]">
              {currentPage}
            </span>
          </>
        )}
      </div>

      {/* User */}
      <div className="flex items-center gap-3">
        <div className="text-right leading-tight">
          <p className="text-[11px] font-semibold text-[#1F2937]">
            {user?.nama_user ?? "-"}
          </p>

          <p className="text-[10px] text-[#6B7280]">
            {user?.role ?? "-"}
          </p>
        </div>

        <div
          className="
            w-10
            h-10
            rounded-full
            border-2
            bg-[#4B5563]
            flex
            items-center
            justify-center
            text-white
            text-xs
            font-semibold
          "
        >
          {user?.nama_user
            ?.charAt(0)
            .toUpperCase() ?? "U"}
        </div>
      </div>
    </header>
  );
}