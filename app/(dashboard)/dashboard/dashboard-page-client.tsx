"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Truck } from "lucide-react";

import DashboardBarChart from "@/components/charts/dashboard-bar-chart";
import MerchTujuanSankeyChart from "@/components/charts/merch-tujuan-sankey-chart";
import StackedMerchBarChart from "@/components/charts/stacked-merch-bar-chart";
import IconImage from "@/components/ui/icon-image";
import { MONTH_FULL } from "@/lib/dashboard-constants";
import type { DashboardData } from "@/lib/dashboard-types";

interface Props {
  dashboard: DashboardData;
}

function formatDelta(delta: number, unit = "pcs", compareLabel = "kemarin") {
  if (delta > 0) {
    return {
      text: `↑ +${delta.toLocaleString("id-ID")} ${unit} dibanding ${compareLabel}`,
      tone: "up" as const,
    };
  }
  if (delta < 0) {
    return {
      text: `↓ ${Math.abs(delta).toLocaleString("id-ID")} ${unit} dibanding ${compareLabel}`,
      tone: "down" as const,
    };
  }
  return { text: `Sama dengan ${compareLabel}`, tone: "neutral" as const };
}

export default function DashboardPageClient({ dashboard }: Props) {
  const router = useRouter();
  const { chartMeta } = dashboard;
  const hariIniDelta = formatDelta(dashboard.distribusiHariIniDelta);

  const chartMerch = dashboard.topMerchandise.map((item) => ({
    label: item.nama,
    total: item.total,
  }));

  const topMerchSubtitle = dashboard.merchandiseTerbanyak
    ? `Terbanyak: ${dashboard.merchandiseTerbanyak} (${dashboard.merchandiseTerbanyakQty.toLocaleString("id-ID")} pcs)`
    : "Belum ada distribusi";

  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return year;
  });

  function setChartYear(year: number) {
    const params = new URLSearchParams(window.location.search);
    params.set("chartTahun", String(year));
    router.replace(`?${params.toString()}`);
  }

  function setSankeyPeriod(month: string, year: string) {
    const params = new URLSearchParams(window.location.search);
    if (!month || !year) {
      params.delete("sankeyBulan");
      params.delete("sankeyTahun");
    } else {
      params.set("sankeyBulan", month);
      params.set("sankeyTahun", year);
    }
    router.replace(`?${params.toString()}`);
  }

  return (
    <div className="flex h-[calc(100dvh-6.25rem)] flex-col gap-3 overflow-hidden">
      <section className="grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          title="Total Stok Tersedia"
          value={dashboard.totalStokTersedia}
          suffix="pcs"
          iconSrc="/icons/icon-stok.svg"
        />
        <KpiCard
          title="Barang Keluar"
          value={dashboard.totalBarangKeluar}
          suffix="pcs"
          iconSrc="/icons/icon-barangkeluar-merah.svg"
          subtitle={topMerchSubtitle}
          subtitleTone="accent"
        />
        <KpiCard
          title="Total Transaksi"
          value={dashboard.totalTransaksi.total}
          suffix="transaksi"
          iconSrc="/icons/icon-transaksi-merah.svg"
          footer={
            <p className="text-[11px] leading-snug">
              <span className="font-medium text-[#059669]">
                {dashboard.totalTransaksi.masuk} Masuk
              </span>
              <span className="text-[#9CA3AF]"> · </span>
              <span className="font-medium text-[#D71920]">
                {dashboard.totalTransaksi.keluar} Keluar
              </span>
            </p>
          }
        />
        <KpiCard
          title="Distribusi Hari Ini"
          value={dashboard.distribusiHariIni}
          suffix="pcs"
          icon={<Truck size={20} className="text-[#D71920]" />}
          delta={hariIniDelta}
          subtitle={
            dashboard.distribusiHariIni > 0
              ? "Distribusi tercatat hari ini"
              : "Belum ada distribusi hari ini"
          }
        />
        <KpiCard
          title="Peringatan Stok Rendah"
          value={dashboard.peringatanStokRendah}
          suffix="item"
          iconSrc="/icons/icon-merchandise-merah.svg"
          variant="danger"
          subtitle={
            dashboard.stokRendahItems[0]
              ? `${dashboard.stokRendahItems[0].nama} (${dashboard.stokRendahItems[0].jumlah} pcs)`
              : "Semua stok aman"
          }
          showChevron={dashboard.peringatanStokRendah > 0}
          href={
            dashboard.peringatanStokRendah > 0 ? "/monitoring" : undefined
          }
        />
      </section>

      {/* Kiri: Top merch + transaksi/bulan; kanan: sankey full height */}
      <section className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-2 lg:grid-rows-2">
        <ChartPanel
          title="Top 5 Merchandise Digunakan"
          subtitle="All time"
          href="/monitoring"
        >
          <DashboardBarChart
            data={chartMerch}
            layout="horizontal"
            emptyMessage="Belum ada merchandise didistribusikan"
          />
        </ChartPanel>

        <ChartPanel
          title="Distribusi Merchandise ke Tujuan"
          subtitle={
            chartMeta.sankeyAllTime
              ? "All time"
              : `${MONTH_FULL[(chartMeta.sankeyMonth ?? 1) - 1]} ${chartMeta.sankeyYear}`
          }
          href="/riwayat-transaksi"
          className="lg:row-span-2"
          toolbar={
            <div className="flex items-center gap-1.5">
              <select
                aria-label="Bulan sankey"
                className="h-7 rounded-md border border-[#E8E4DF] bg-white px-2 text-[10px] text-[#374151]"
                value={chartMeta.sankeyMonth ?? ""}
                onChange={(e) =>
                  setSankeyPeriod(
                    e.target.value,
                    e.target.value
                      ? String(chartMeta.sankeyYear ?? chartMeta.chartYear)
                      : ""
                  )
                }
              >
                <option value="">Semua bulan</option>
                {MONTH_FULL.map((label, index) => (
                  <option key={label} value={index + 1}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                aria-label="Tahun sankey"
                className="h-7 rounded-md border border-[#E8E4DF] bg-white px-2 text-[10px] text-[#374151]"
                value={chartMeta.sankeyYear ?? ""}
                onChange={(e) =>
                  setSankeyPeriod(
                    e.target.value
                      ? String(
                          chartMeta.sankeyMonth ?? new Date().getMonth() + 1
                        )
                      : "",
                    e.target.value
                  )
                }
              >
                <option value="">All time</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          }
        >
          <MerchTujuanSankeyChart links={dashboard.sankeyLinks} />
        </ChartPanel>

        <ChartPanel
          title="Transaksi Barang Keluar per Bulan"
          subtitle={`Berdasarkan jenis merchandise · ${chartMeta.chartYear}`}
          href="/barang-keluar"
          toolbar={
            <select
              aria-label="Tahun chart transaksi"
              className="h-7 rounded-md border border-[#E8E4DF] bg-white px-2 text-[10px] text-[#374151]"
              value={chartMeta.chartYear}
              onChange={(e) => setChartYear(Number(e.target.value))}
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          }
        >
          <StackedMerchBarChart
            data={dashboard.transaksiPerBulan}
            emptyMessage="Belum ada tren transaksi"
          />
        </ChartPanel>
      </section>
    </div>
  );
}

type DeltaInfo = {
  text: string;
  tone: "up" | "down" | "neutral";
};

function KpiCard({
  title,
  value,
  suffix,
  subtitle,
  subtitleTone,
  delta,
  footer,
  iconSrc,
  icon,
  variant = "default",
  showChevron,
  href,
}: {
  title: string;
  value: number | string;
  suffix?: string;
  subtitle?: string;
  subtitleTone?: "default" | "accent";
  delta?: DeltaInfo;
  footer?: React.ReactNode;
  iconSrc?: string;
  icon?: React.ReactNode;
  variant?: "default" | "danger";
  showChevron?: boolean;
  href?: string;
}) {
  const isDanger = variant === "danger";

  const deltaColor =
    delta?.tone === "up"
      ? isDanger
        ? "text-white/90"
        : "text-[#059669]"
      : delta?.tone === "down"
        ? isDanger
          ? "text-white/90"
          : "text-[#D71920]"
        : isDanger
          ? "text-white/70"
          : "text-[#6B7280]";

  const content = (
    <div
      className={`h-full rounded-xl border p-4 ${
        isDanger
          ? "border-[#B1070E] bg-[#B01B1C] text-white"
          : "border-[#EFEAE5] bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p
            className={`text-[11px] font-semibold uppercase tracking-wide ${
              isDanger ? "text-white/90" : "text-[#6B7280]"
            }`}
          >
            {title}
          </p>
          <div className="mt-1.5 flex items-end gap-1">
            <p
              className={`text-2xl font-bold ${
                isDanger ? "text-white" : "text-[#1A1A1A]"
              }`}
            >
              {typeof value === "number"
                ? value.toLocaleString("id-ID")
                : value}
            </p>
            {suffix && (
              <span
                className={`pb-0.5 text-xs ${
                  isDanger ? "text-white/80" : "text-[#6B7280]"
                }`}
              >
                {suffix}
              </span>
            )}
          </div>

          {delta && (
            <p className={`mt-1 text-[11px] leading-snug ${deltaColor}`}>
              {delta.text}
            </p>
          )}

          {subtitle && (
            <p
              className={`mt-1 line-clamp-2 text-[11px] leading-snug ${
                isDanger
                  ? "text-white/85"
                  : subtitleTone === "accent"
                    ? "text-[#D71920]"
                    : "text-[#6B7280]"
              }`}
            >
              {subtitle}
              {showChevron && (
                <ChevronRight size={12} className="ml-0.5 inline" />
              )}
            </p>
          )}

          {footer && <div className="mt-1">{footer}</div>}
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            isDanger ? "bg-white/20" : "bg-[#FFF2F2]"
          }`}
        >
          {iconSrc ? (
            <IconImage
              src={iconSrc}
              size={20}
              className={isDanger ? "brightness-0 invert" : ""}
            />
          ) : (
            icon
          )}
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full transition hover:opacity-95">
        {content}
      </Link>
    );
  }

  return content;
}

function ChartPanel({
  title,
  subtitle,
  href,
  toolbar,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  toolbar?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#EFEAE5] bg-white ${className ?? ""}`}
    >
      <div className="flex shrink-0 items-start justify-between gap-2 px-4 pt-3 pb-1">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[#1A1A1A]">{title}</h3>
          {subtitle && (
            <p className="text-[10px] text-[#9CA3AF]">{subtitle}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {toolbar}
          {href && (
            <Link
              href={href}
              className="text-[10px] font-semibold text-[#D71920] hover:underline"
            >
              Lihat Semua
            </Link>
          )}
        </div>
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col px-3 pb-4 pt-1">
        {children}
      </div>
    </div>
  );
}
