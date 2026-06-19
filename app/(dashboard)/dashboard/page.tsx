"use client";

import { useEffect, useState } from "react";
import {
  Package,
  Boxes,
  ArrowUpRight,
  TrainFront,
  ShoppingBag,
} from "lucide-react";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";

interface DashboardData {
  totalMerchandise: number;
  totalStock: number;
  totalBarangKeluarBulanIni: number;
  totalStasiun: number;

  topMerchandise: {
    nama: string;
    total: number;
  }[];

  distribusiPerStasiun: {
    nama: string;
    total: number;
  }[];

  stokGudang: {
    id: number;
    nama: string;
    stok: number;
  }[];
}

interface User {
  id_user: number;
  nama_user: string;
  email: string;
  role: string;
}

const COLORS = [
  "#D71920",
  "#E24B4B",
  "#EE7A7A",
  "#F4A7A7",
  "#F8CACA",
];

export default function DashboardPage() {
  const [user, setUser] =
    useState<User | null>(null);

  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [userRes, dashboardRes] =
          await Promise.all([
            fetch("/api/auth/me"),
            fetch("/api/dashboard"),
          ]);

        if (userRes.ok) {
          setUser(await userRes.json());
        }

        if (dashboardRes.ok) {
          setDashboard(
            await dashboardRes.json()
          );
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-base text-[#444]">
          Memuat Dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <section
        className="
          rounded-2xl
          border
          border-[#EFEAE5]
          bg-linear-to-r
          from-white
          via-[#FAFAFA]
          to-[#E7A5A5]
          p-8
        "
      >
        <h1 className="text-3xl font-semibold text-[#1A1A1A]">
          Selamat Datang,{" "}
          {user?.nama_user ?? "-"}
        </h1>

        <p className="mt-3 text-[15px] text-[#444]">
          Berikut adalah ringkasan
          pengelolaan merchandise
          LRT Jabodebek.
        </p>
      </section>

      {/* Summary */}
      <section
        className="
          grid
          grid-cols-1
          md:grid-cols-2
          xl:grid-cols-4
          gap-5
        "
      >
        <SummaryCard
          title="TOTAL MERCHANDISE"
          value={
            dashboard?.totalMerchandise ?? 0
          }
          icon={<Package size={20} />}
        />

        <SummaryCard
          title="TOTAL STOK TERSEDIA"
          value={
            dashboard?.totalStock ?? 0
          }
          icon={<Boxes size={20} />}
        />

        <SummaryCard
          title="BARANG KELUAR BULAN INI"
          value={
            dashboard?.totalBarangKeluarBulanIni ??
            0
          }
          icon={
            <ArrowUpRight size={20} />
          }
        />

        <SummaryCard
          title="STASIUN PENERIMA"
          value={
            dashboard?.totalStasiun ?? 0
          }
          icon={
            <TrainFront size={20} />
          }
        />
      </section>

      {/* Charts */}
      <section
        className="
          grid
          grid-cols-1
          xl:grid-cols-2
          gap-5
        "
      >
        <div
          className="
            bg-white
            rounded-2xl
            border
            border-[#EFEAE5]
            p-6
          "
        >
          <h3 className="text-xl font-semibold text-[#1A1A1A] mb-4">
            Merchandise Terbanyak
            Digunakan
          </h3>

          <div className="h-75">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={
                    dashboard?.topMerchandise ??
                    []
                  }
                  dataKey="total"
                  nameKey="nama"
                  innerRadius={70}
                  outerRadius={100}
                >
                  {(
                    dashboard?.topMerchandise ??
                    []
                  ).map((_, index) => (
                    <Cell
                      key={index}
                      fill={
                        COLORS[
                          index %
                            COLORS.length
                        ]
                      }
                    />
                  ))}
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          className="
            bg-white
            rounded-2xl
            border
            border-[#EFEAE5]
            p-6
          "
        >
          <h3 className="text-xl font-semibold text-[#1A1A1A] mb-4">
            Distribusi per Stasiun
          </h3>

          <div className="h-75">
            <ResponsiveContainer>
              <BarChart
                data={
                  dashboard?.distribusiPerStasiun ??
                  []
                }
              >
                <XAxis dataKey="nama" />

                <YAxis />

                <Tooltip />

                <Bar
                  dataKey="total"
                  fill="#D71920"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Monitoring */}
      <section
        className="
          bg-white
          rounded-2xl
          border
          border-[#EFEAE5]
          p-6
        "
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-semibold text-[#1A1A1A]">
            Monitoring Stok Gudang
            Pusat
          </h3>

          <button
            className="
              text-[#D71920]
              text-sm
              font-medium
            "
          >
            Manage Inventory
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-5">
          {dashboard?.stokGudang.map(
            (item) => (
              <div
                key={item.id}
                className="
                  w-57.5
                  rounded-xl
                  border
                  border-[#EFEAE5]
                  bg-[#FAFAFA]
                  p-5
                  text-center
                "
              >
                <div className="flex justify-center mb-3">
                  <ShoppingBag
                    size={26}
                    className="text-[#D71920]"
                  />
                </div>

                <h4 className="text-[15px] font-medium text-[#333]">
                  {item.nama}
                </h4>

                <p className="text-2xl font-bold text-[#1A1A1A] mt-2">
                  {item.stok}
                </p>
              </div>
            )
          )}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="
        bg-white
        border
        border-[#EFEAE5]
        rounded-2xl
        p-5
      "
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-[#666]">
            {title}
          </p>

          <h2 className="mt-3 text-2xl font-bold text-[#1A1A1A]">
            {value}
          </h2>
        </div>

        <div
          className="
            w-11
            h-11
            rounded-xl
            bg-[#FFF2F2]
            text-[#D71920]
            flex
            items-center
            justify-center
          "
        >
          {icon}
        </div>
      </div>
    </div>
  );
}