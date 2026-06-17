"use client";

import { useEffect, useState } from "react";

interface User {
  id_user: number;
  nama_user: string;
  email: string;
  role: string;
  id_stasiun: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get user info from API or localStorage
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <section className="rounded-2xl bg-gradient-to-r from-[#FFF3F3] to-[#FBE4E4] p-8 border border-[#EFEAE5]">
        <h1 className="text-3xl font-bold text-[#1A1A1A]">
          Selamat Datang, {user?.nama_user || "Administrator"}
        </h1>

        <p className="mt-2 text-[#666666]">
          Berikut adalah ringkasan mengenai Pengelolaan Merchandise
          di LRT JABODEBEK.
        </p>

        <div className="mt-4 text-sm text-gray-600">
          <p>📧 Email: {user?.email}</p>
          <p>👤 Role: {user?.role}</p>
        </div>
      </section>

      {/* Statistic Cards */}
      <section className="grid grid-cols-4 gap-4">

        <div className="bg-white rounded-2xl border border-[#EFEAE5] p-5">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Total Merchandise
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            0
          </h2>
        </div>

        <div className="bg-white rounded-2xl border border-[#EFEAE5] p-5">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Total Stok Tersedia
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            0
          </h2>
        </div>

        <div className="bg-white rounded-2xl border border-[#EFEAE5] p-5">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Barang Keluar Bulan Ini
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            0
          </h2>
        </div>

        <div className="bg-white rounded-2xl border border-[#EFEAE5] p-5">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Stasiun Penerima
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            20
          </h2>
        </div>

      </section>

      {/* Charts */}
      <section className="grid grid-cols-2 gap-6">

        <div className="bg-white rounded-2xl border border-[#EFEAE5] p-6 min-h-80">
          <h3 className="text-xl font-semibold mb-4">
            Merchandise Terbanyak Digunakan
          </h3>

          <div className="flex items-center justify-center h-55 text-gray-400">
            Donut Chart
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#EFEAE5] p-6 min-h-80">
          <h3 className="text-xl font-semibold mb-4">
            Distribusi per Stasiun
          </h3>

          <div className="flex items-center justify-center h-55 text-gray-400">
            Bar Chart
          </div>
        </div>

      </section>

      {/* Monitoring Stock */}
      <section className="bg-white rounded-2xl border border-[#EFEAE5] p-6">

        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-semibold">
            Monitoring Stok Gudang Pusat
          </h3>

          <button className="text-[#B71C1C] font-medium">
            Manage Inventory
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">

          <div className="border border-[#EFEAE5] rounded-xl p-5 text-center">
            <h4 className="font-medium">Tumbler</h4>

            <p className="text-3xl font-bold mt-2">
              0
            </p>
          </div>

          <div className="border border-[#EFEAE5] rounded-xl p-5 text-center">
            <h4 className="font-medium">Tote Bag</h4>

            <p className="text-3xl font-bold mt-2">
              0
            </p>
          </div>

          <div className="border border-[#EFEAE5] rounded-xl p-5 text-center">
            <h4 className="font-medium">Sticker</h4>

            <p className="text-3xl font-bold mt-2">
              0
            </p>
          </div>

          <div className="border border-[#EFEAE5] rounded-xl p-5 text-center">
            <h4 className="font-medium">Bantal</h4>

            <p className="text-3xl font-bold mt-2">
              0
            </p>
          </div>

        </div>

      </section>

    </div>
  );
}