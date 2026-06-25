"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import MerchandiseUsageChart from "@/components/charts/merchandise-usage-chart";
import StationDistributionChart from "@/components/charts/station-distribution-chart";
import IconImage from "@/components/ui/icon-image";
import { useDashboardUser } from "@/components/providers/dashboard-user";
import type { DashboardData } from "@/lib/dashboard";

interface Props {
  dashboard: DashboardData;
}

export default function DashboardPageClient({ dashboard }: Props) {
  const user = useDashboardUser();
  return (
    <div className="space-y-6">
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
          Selamat Datang, {user.nama_user}
        </h1>

        <p className="mt-3 text-[15px] text-[#444]">
          Berikut adalah ringkasan pengelolaan merchandise LRT Jabodebek.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="JENIS MERCHANDISE"
          value={dashboard.totalMerchandise}
          iconSrc="/icons/icon-merchandise-merah.svg"
        />
        <SummaryCard
          title="TOTAL STOK TERSEDIA"
          value={dashboard.totalStock}
          iconSrc="/icons/icon-stok.svg"
        />
        <SummaryCard
          title="BARANG KELUAR BULAN INI"
          value={dashboard.totalBarangKeluarBulanIni}
          iconSrc="/icons/icon-barangkeluar-merah.svg"
        />
        <SummaryCard
          title="STASIUN PENERIMA"
          value={dashboard.totalStasiun}
          iconSrc="/icons/icon-red-stasiun.svg"
        />
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-[#EFEAE5] bg-white p-6">
          <h3 className="mb-6 text-xl font-semibold text-[#1A1A1A]">
            Merchandise Terbanyak Digunakan
          </h3>
          <MerchandiseUsageChart data={dashboard.topMerchandise} />
        </div>

        <div className="rounded-2xl border border-[#EFEAE5] bg-white p-6">
          <h3 className="mb-4 text-xl font-semibold text-[#1A1A1A]">
            Distribusi per Stasiun
          </h3>
          <div className="w-full min-w-0">
            <StationDistributionChart data={dashboard.distribusiPerStasiun} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#EFEAE5] bg-white p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-2xl font-semibold text-[#1A1A1A]">
            Monitoring Stok Gudang Pusat
          </h3>
          <Link
            href="/merchandise"
            className="text-sm font-medium text-[#D71920] hover:underline"
          >
            Kelola Merchandise
          </Link>
        </div>

        <div className="flex flex-wrap justify-center gap-5">
          {dashboard.stokGudang.map((item) => (
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
              <div className="mb-3 flex justify-center">
                <ShoppingBag size={26} className="text-[#D71920]" />
              </div>
              <h4 className="text-[15px] font-medium text-[#333]">{item.nama}</h4>
              <p className="mt-2 text-2xl font-bold text-[#1A1A1A]">{item.stok}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  iconSrc,
}: {
  title: string;
  value: number;
  iconSrc: string;
}) {
  return (
    <div className="rounded-2xl border border-[#EFEAE5] bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-[#666]">{title}</p>
          <h2 className="mt-3 text-2xl font-bold text-[#1A1A1A]">{value}</h2>
        </div>
        <div
          className="
            flex h-11 w-11
            items-center justify-center
            rounded-xl bg-[#FFF2F2] text-[#D71920]
          "
        >
          <IconImage src={iconSrc} size={22} />
        </div>
      </div>
    </div>
  );
}
