"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import PageHeader from "@/components/ui/page-header";

interface MonitoringOverview {
  summary: {
    totalStokAktif: number;
    stasiunAktif: number;
    distribusiBulanIni: number;
    peringatanStokRendah: number;
  };
  topMerchandise: {
    id_merch: number;
    nama: string;
    total: number;
    delta: number;
  }[];
  stasiunDistribution: {
    id_stasiun: number;
    kode: string;
    nama: string;
    total: number;
  }[];
  recentActivity: {
    id: string;
    message: string;
    time: string;
    type: string;
    tone: "urgent" | "processing" | "alert" | "verified";
  }[];
  lowStockItems: {
    id_merch: number;
    nama: string;
    jumlah: number;
    status: string;
  }[];
}

const ACTIVITY_TONE: Record<string, string> = {
  urgent: "text-[#B1070E]",
  processing: "text-[#2563EB]",
  alert: "text-[#D97706]",
  verified: "text-[#059669]",
};

export default function MonitoringPage() {
  const [data, setData] = useState<MonitoringOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/monitoring/overview")
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-[#6B7280]">
        Memuat monitoring...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-20 text-center text-sm text-[#6B7280]">
        Gagal memuat data monitoring
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monitoring"
        description="Real-time overview of inventory and station distribution status."
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric
          label="Total Stok Aktif"
          value={data.summary.totalStokAktif}
          iconSrc="/icons/icon-stok.svg"
        />
        <SummaryMetric
          label="Stasiun Aktif"
          value={data.summary.stasiunAktif}
          iconSrc="/icons/icon-red-stasiun.svg"
        />
        <SummaryMetric
          label="Distribusi Bulan Ini"
          value={data.summary.distribusiBulanIni}
          suffix="pcs"
          iconSrc="/icons/icon-barangkeluar-merah.svg"
        />
        <SummaryMetric
          label="Peringatan Stok Rendah"
          value={data.summary.peringatanStokRendah}
          iconSrc="/icons/icon-merchandise-merah.svg"
          highlight
          stockLabels={data.lowStockItems.map((item) => ({
            nama: item.nama,
            jumlah: item.jumlah,
          }))}
        />
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="rounded-2xl border border-[#EFEAE5] bg-white p-6 shadow-sm xl:col-span-1">
          <h2 className="text-lg font-semibold text-[#1A1C1C]">
            Top Merchandise Distribution
          </h2>

          <div className="mt-5 space-y-4">
            {data.topMerchandise.length === 0 ? (
              <p className="text-sm text-[#6B7280]">Belum ada data distribusi</p>
            ) : (
              data.topMerchandise.map((item) => (
                <div
                  key={item.id_merch}
                  className="flex items-center justify-between gap-4 border-b border-[#F3F4F6] pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#1A1C1C]">
                      {item.nama}
                    </p>
                    <p className="mt-1 text-sm text-[#6B7280]">
                      {item.total.toLocaleString("id-ID")} pcs
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-semibold ${
                      item.delta >= 0 ? "text-[#059669]" : "text-[#DC2626]"
                    }`}
                  >
                    {item.delta >= 0 ? "+" : ""}
                    {item.delta} pcs
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[#EFEAE5] bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#1A1C1C]">
                Stock Distribution per Stasiun
              </h2>
              <p className="mt-1 text-sm text-[#6B7280]">
                Monitoring storage capacity and stock availability across all
                active LRT stations.
              </p>
            </div>
            <Link
              href="/barang-keluar"
              className="text-sm font-semibold text-[#B1070E] hover:underline"
            >
              View All Transactions
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {data.stasiunDistribution.length === 0 ? (
              <p className="text-sm text-[#6B7280] sm:col-span-2">
                Belum ada distribusi ke stasiun
              </p>
            ) : (
              data.stasiunDistribution.map((item) => (
                <article
                  key={item.id_stasiun}
                  className="rounded-xl border border-[#EFEAE5] bg-[#FAFAFA] p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-[#1A1C1C]">
                        {item.nama}
                      </h3>
                      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                        {item.kode}
                      </p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF2F2]">
                      <Image
                        src="/icons/icon-red-stasiun.svg"
                        alt=""
                        width={18}
                        height={18}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-wide text-[#6B7280]">
                      Total Distribusi
                    </p>
                    <p className="mt-1 text-2xl font-bold text-[#1A1C1C]">
                      {item.total.toLocaleString("id-ID")}{" "}
                      <span className="text-sm font-medium text-[#6B7280]">
                        pcs
                      </span>
                    </p>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#EFEAE5] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#1A1C1C]">Recent Activity</h2>

        <div className="mt-5 divide-y divide-[#F3F4F6]">
          {data.recentActivity.length === 0 ? (
            <p className="py-4 text-sm text-[#6B7280]">Belum ada aktivitas</p>
          ) : (
            data.recentActivity.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="text-sm text-[#1A1C1C]">{item.message}</p>
                <p className="shrink-0 text-xs text-[#6B7280]">
                  {item.time}
                  {" • "}
                  <span className={ACTIVITY_TONE[item.tone] ?? "text-[#6B7280]"}>
                    {item.type}
                  </span>
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  suffix,
  iconSrc,
  highlight,
  stockLabels,
}: {
  label: string;
  value: number;
  suffix?: string;
  iconSrc: string;
  highlight?: boolean;
  stockLabels?: { nama: string; jumlah: number }[];
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${
        highlight
          ? "border-[#B1070E] bg-[#B01B1C] text-white"
          : "border-[#EFEAE5] bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p
            className={`text-xs font-semibold uppercase tracking-wide ${
              highlight ? "text-white/90" : "text-[#6B7280]"
            }`}
          >
            {label}
          </p>
          <div className="mt-3 flex items-end gap-2">
            <p
              className={`text-3xl font-bold ${
                highlight ? "text-white" : "text-[#1A1C1C]"
              }`}
            >
              {value.toLocaleString("id-ID")}
            </p>
            {suffix && (
              <span
                className={`pb-1 text-sm ${
                  highlight ? "text-white/80" : "text-[#6B7280]"
                }`}
              >
                {suffix}
              </span>
            )}
          </div>

          {highlight && stockLabels && stockLabels.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {stockLabels.map((item) => (
                <span
                  key={item.nama}
                  className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-medium text-white"
                >
                  {item.nama} · {item.jumlah.toLocaleString("id-ID")} pcs
                </span>
              ))}
            </div>
          )}

          {highlight && stockLabels && stockLabels.length === 0 && (
            <p className="mt-3 text-xs text-white/80">Semua stok aman</p>
          )}
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            highlight ? "bg-white/20" : "bg-[#FFF2F2]"
          }`}
        >
          <Image
            src={iconSrc}
            alt=""
            width={22}
            height={22}
            className={highlight ? "brightness-0 invert" : undefined}
          />
        </div>
      </div>
    </div>
  );
}
