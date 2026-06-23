"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Package, ShoppingBag } from "lucide-react";

import MerchandiseUsageChart from "@/components/charts/merchandise-usage-chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
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
          title="JENIS MERCHANDISE"
          value={
            dashboard?.totalMerchandise ?? 0
          }
          iconSrc="/icons/icon-merchandise-merah.svg"
        />

        <SummaryCard
          title="TOTAL STOK TERSEDIA"
          value={
            dashboard?.totalStock ?? 0
          }
          iconSrc="/icons/icon-stok.svg"
        />

        <SummaryCard
          title="BARANG KELUAR BULAN INI"
          value={
            dashboard?.totalBarangKeluarBulanIni ??
            0
          }
          iconSrc="/icons/icon-barangkeluar-merah.svg"
        />

        <SummaryCard
          title="STASIUN PENERIMA"
          value={
            dashboard?.totalStasiun ?? 0
          }
          iconSrc="/icons/icon-red-stasiun.svg"
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
          <h3 className="mb-6 text-xl font-semibold text-[#1A1A1A]">
            Merchandise Terbanyak Digunakan
          </h3>

          <MerchandiseUsageChart
            data={dashboard?.topMerchandise ?? []}
          />
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
                  fill="#C62828"
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
  iconSrc,
  icon,
}: {
  title: string;
  value: number;
  iconSrc?: string;
  icon?: React.ReactNode;
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
          {iconSrc ? (
            <Image src={iconSrc} alt="" width={22} height={22} />
          ) : (
            icon
          )}
        </div>
      </div>
    </div>
  );
}