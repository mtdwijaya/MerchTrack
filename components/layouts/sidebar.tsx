"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menus = [
  {
    name: "Dashboard",
    href: "/dashboard",
  },
  {
    name: "Barang Keluar",
    href: "/barang-keluar",
  },
  {
    name: "Monitoring",
    href: "/monitoring",
  },
  {
    name: "History",
    href: "/history",
  },
  {
    name: "Manajemen Stasiun",
    href: "/stasiun",
  },
  {
    name: "Manajemen Merchandise",
    href: "/merchandise",
  },
  {
    name: "Manajemen Pengguna",
    href: "/pengguna",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="
      w-[280px]
      min-h-screen
      text-white
      flex
      flex-col
      bg-gradient-to-br
      from-[#D71920]
      via-[#A5050A]
      to-[#650004]
    "
    >
      <div className="p-6">
        <h1 className="text-3xl font-bold">
          MerchTrack
        </h1>

        <p className="mt-4 text-sm text-white/90">
          Sistem Informasi Pengelolaan
          Merchandise Berbasis Web
        </p>
      </div>

      <div className="px-4 flex-1">
        <p className="text-xs font-semibold text-white/60 mb-3">
          MAIN MENU
        </p>

        <nav className="space-y-2">
          {menus.map((menu) => (
            <Link
              key={menu.href}
              href={menu.href}
              className={`
                block
                rounded-xl
                px-4
                py-3
                transition
                ${
                  pathname === menu.href
                    ? "bg-white/20"
                    : "hover:bg-white/10"
                }
              `}
            >
              {menu.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-white/20 p-5">
        <div className="font-semibold">
          Administrator
        </div>

        <div className="text-sm text-white/70">
          Profil Pengguna
        </div>
      </div>
    </aside>
  );
}