"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { sidebarMenus } from "@/constants/sidebar-menu";
import IconImage from "@/components/ui/icon-image";

interface User {
  id_user: number;
  nama_user: string;
  email: string;
  role: "ADMIN" | "PETUGAS";
}

interface SidebarProps {
  user: User | null;
  collapsed: boolean;
  setCollapsed: React.Dispatch<
    React.SetStateAction<boolean>
  >;
}

export default function Sidebar({
  user,
  collapsed,
  setCollapsed,
}: SidebarProps) {
  const pathname = usePathname();

  if (!user) {
    return (
      <aside
        className="
          fixed
          left-0
          top-0
          h-screen
          w-75.5
          bg-linear-to-b
          from-[#D71920]
          via-[#B1070E]
          to-[#650000]
        "
      />
    );
  }

  const menu =
    sidebarMenus[user.role];

  return (
    <aside
      className={`
        ${
          collapsed
            ? "w-16.5"
            : "w-75.5"
        }

        fixed
        left-0
        top-0
        z-50

        h-screen
        overflow-y-auto

        text-white

        bg-linear-to-b
        from-[#b91319]
        via-[#830408]
        to-[#350000]

        flex
        flex-col

        px-3
        py-4

        transition-all
        duration-300
      `}
    >
      {/* Header */}
      <div>
        <div
          className={
            collapsed
              ? "flex flex-col items-center gap-3"
              : "flex items-center justify-between"
          }
        >
          <div
            className={
              collapsed
                ? "flex justify-center"
                : "flex items-center gap-2"
            }
          >
            <img
              src="/logos/lrt-bw.svg"
              alt="LRT"
              width={73}
              height={33}
              className={
                collapsed
                  ? "h-6 w-auto shrink-0"
                  : "h-7 w-auto shrink-0"
              }
            />

            {!collapsed && (
              <>
                <div className="w-px h-5 bg-white/40" />

                <img
                  src="/logos/MerchTrack-bw.svg"
                  alt="MerchTrack"
                  width={152}
                  height={19}
                  className="h-4 w-auto shrink-0"
                />
              </>
            )}
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={() => setCollapsed(!collapsed)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setCollapsed(!collapsed);
              }
            }}
            className="
              text-xs
              bg-white/10
              hover:bg-white/20
              rounded-md
              px-2
              py-1
              shrink-0
              cursor-pointer
            "
          >
            {collapsed ? "→" : "←"}
          </div>
        </div>

        {!collapsed && (
          <div className="mt-4 text-[13px] leading-5 text-white/80">
            <p>
              Sistem Informasi
              Pengelolaan
            </p>
            <p>Merchandise LRT</p>
          </div>
        )}
      </div>

      {/* Menu */}
      <div className="mt-8 flex-1">
        {!collapsed && (
          <h3 className="text-[11px] font-semibold text-white/60 uppercase tracking-widest mb-3">
            Main Menu
          </h3>
        )}

        <div className="flex flex-col gap-2">
          {menu.main.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              title={item.name}
              className={`
                flex
                items-center
                gap-3
                px-2.5
                py-3.5
                rounded-lg
                transition-all

                ${
                  pathname.startsWith(item.href)
                    ? "bg-white/15 border-l-2 border-white"
                    : "hover:bg-white/10"
                }
              `}
            >
              <IconImage src={item.icon} alt={item.name} size={14} />

              {!collapsed && (
                <span className="text-[13px]">
                  {item.name}
                </span>
              )}
            </Link>
          ))}
        </div>

        {menu.master.length >
          0 && (
          <>
            {!collapsed && (
              <h3 className="mt-6 mb-3 text-[11px] font-semibold text-white/60 uppercase tracking-widest">
                Master Data
              </h3>
            )}

            <div className="flex flex-col gap-2">
              {menu.master.map(
                (item) => (
                  <Link
                    key={
                      item.href
                    }
                    href={
                      item.href
                    }
                    prefetch
                    title={
                      item.name
                    }
                    className={`
                    flex
                    items-center
                    gap-3
                    px-2.5
                    py-3.5
                    rounded-lg
                    transition-all

                    ${
                      pathname.startsWith(item.href)
                        ? "bg-white/15 border-l-2 border-white"
                        : "hover:bg-white/10"
                    }
                  `}
                  >
                    <IconImage
                      src={item.icon}
                      alt={item.name}
                      size={14}
                    />

                    {!collapsed && (
                      <span className="text-[13px]">
                        {
                          item.name
                        }
                      </span>
                    )}
                  </Link>
                )
              )}
            </div>
          </>
        )}
      </div>

      {/* User */}
      <div className="border-t border-white/15 pt-4">
        <div className="flex items-center gap-2">
          <div
            className="
              w-8
              h-8
              rounded-full
              bg-[#134B6F]
              flex
              items-center
              justify-center
              text-xs
              font-semibold
            "
          >
            {user.nama_user.charAt(
              0
            )}
          </div>

          {!collapsed && (
            <div>
              <p className="text-[11px] font-medium">
                {user.nama_user}
              </p>

              <p className="text-[10px] text-white/60">
                {user.role}
              </p>
            </div>
          )}
        </div>

        <div
          role="button"
          tabIndex={0}
          className="
            mt-3
            w-full
            bg-white/10
            hover:bg-white/20
            rounded-lg
            py-1.5
            text-[11px]
            transition
            cursor-pointer
            text-center
          "
          onClick={async () => {
            await fetch(
              "/api/auth/logout",
              {
                method: "POST",
              }
            );

            window.location.href =
              "/login";
          }}
          onKeyDown={async (e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            e.preventDefault();
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/login";
          }}
        >
          {collapsed
            ? "⎋"
            : "Logout"}
        </div>
      </div>
    </aside>
  );
}