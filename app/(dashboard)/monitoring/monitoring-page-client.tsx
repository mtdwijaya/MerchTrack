"use client";

import type { Role } from "@prisma/client";
import IconImage from "@/components/ui/icon-image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import PageHeader from "@/components/ui/page-header";
import { RelativeTime } from "@/components/ui/relative-time";
import type {
  MonitoringOverview,
  RecentActivity,
} from "@/lib/monitoring-overview";

const REFRESH_INTERVAL_MS = 15_000;

// warna label aktivitas di feed monitoring
const ACTIVITY_TONE: Record<string, string> = {
  urgent: "text-[#B1070E]",
  processing: "text-[#2563EB]",
  alert: "text-[#D97706]",
  verified: "text-[#059669]",
};

interface Props {
  data: MonitoringOverview;
  recentActivity: RecentActivity;
  role: Role;
}

export default function MonitoringPageClient({
  data,
  recentActivity,
  role,
}: Props) {
  const router = useRouter();

  useEffect(() => {
    // refresh data monitoring dari server tanpa reload halaman penuh
    const interval = setInterval(() => {
      router.refresh();
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monitoring"
        description={
          role === "ADMIN"
            ? "Ringkasan stok, distribusi, dan seluruh aktivitas sistem. Aktivitas diperbarui otomatis setiap 15 detik."
            : "Ringkasan stok dan aktivitas terbaru. Aktivitas diperbarui otomatis setiap 15 detik."
        }
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
            Distribusi Merchandise Teratas
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
                Distribusi Stok per Stasiun
              </h2>
              <p className="mt-1 text-sm text-[#6B7280]">
                Kapasitas dan ketersediaan stok di seluruh stasiun LRT aktif.
              </p>
            </div>
            <Link
              href="/barang-keluar"
              className="text-sm font-semibold text-[#B1070E] hover:underline"
            >
              Lihat Semua Transaksi
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
                      <IconImage src="/icons/icon-red-stasiun.svg" size={18} />
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-wide text-[#6B7280]">
                      Total Distribusi
                    </p>
                    <p className="mt-1 text-2xl font-bold text-[#1A1C1C]">
                      {item.total.toLocaleString("id-ID")}{" "}
                      <span className="text-sm font-medium text-[#6B7280]">pcs</span>
                    </p>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#EFEAE5] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-[#1A1C1C]">Aktivitas Terbaru</h2>
          <p className="text-xs text-[#6B7280]">
            {role === "ADMIN"
              ? "Semua transaksi & restock"
              : "Semua barang keluar & peringatan stok"}
          </p>
        </div>

        <div className="mt-5 divide-y divide-[#F3F4F6]">
          {recentActivity.length === 0 ? (
            <p className="py-4 text-sm text-[#6B7280]">Belum ada aktivitas</p>
          ) : (
            recentActivity.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="text-sm text-[#1A1C1C]">{item.message}</p>
                <p className="shrink-0 text-xs text-[#6B7280]">
                  {item.occurredAt ? (
                    <RelativeTime iso={item.occurredAt} />
                  ) : (
                    "Peringatan sistem"
                  )}
                  {" • "}
                  <span className={ACTIVITY_TONE[item.tone] ?? "text-[#6B7280]"}>
                    {item.type}
                  </span>
                  {role === "ADMIN" && item.audience === "admin" && (
                    <>
                      {" • "}
                      <span className="font-medium text-[#7C3AED]">Admin</span>
                    </>
                  )}
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
          <IconImage
            src={iconSrc}
            size={22}
            className={highlight ? "brightness-0 invert" : ""}
          />
        </div>
      </div>
    </div>
  );
}
