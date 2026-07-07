"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownToLine,
  ChevronRight,
  Package,
  ShoppingBag,
  Truck,
} from "lucide-react";

import CategoryPieChart from "@/components/charts/category-pie-chart";
import DashboardBarChart from "@/components/charts/dashboard-bar-chart";
import IconImage from "@/components/ui/icon-image";
import type { DashboardData } from "@/lib/dashboard-types";

import DashboardPeriodFilter from "./dashboard-period-filter";

interface Props {
  dashboard: DashboardData;
  selectedMonth: number;
  selectedYear: number;
}

function formatDelta(
  delta: number,
  unit = "pcs",
  compareLabel = "bulan lalu"
) {
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

export default function DashboardPageClient({
  dashboard,
  selectedMonth,
  selectedYear,
}: Props) {
  const { chartMeta } = dashboard;
  const periodLabel = `${chartMeta.bulan} ${chartMeta.tahun}`;

  const stokDelta = formatDelta(
    dashboard.totalStokDelta,
    "pcs",
    chartMeta.bulanLalu
  );
  const keluarDelta = formatDelta(dashboard.barangKeluarDelta);
  const transaksiDelta = formatDelta(
    dashboard.transaksiBulanIni.delta,
    "transaksi"
  );
  const hariIniDelta = formatDelta(
    dashboard.distribusiHariIniDelta,
    "pcs",
    "kemarin"
  );

  const chartStasiun = dashboard.top5StasiunTeraktif.map((item) => ({
    label: item.nama,
    total: item.total,
  }));

  const chartTrend = dashboard.trendDistribusi.map((item) => ({
    label: item.label,
    total: item.total,
    isCurrent: item.isCurrent,
  }));

  const chartMerch = dashboard.top5Merchandise.map((item) => ({
    label: item.nama,
    total: item.total,
  }));

  const topMerchSubtitle = dashboard.merchandiseTerbanyak
    ? `Terbanyak: ${dashboard.merchandiseTerbanyak} (${dashboard.merchandiseTerbanyakQty} pcs)`
    : `Belum ada distribusi ${periodLabel.toLowerCase()}`;

  return (
    <div className="flex h-[calc(100dvh-7.75rem)] flex-col gap-2.5 overflow-hidden">
      <div className="flex shrink-0 items-center justify-end">
        <DashboardPeriodFilter month={selectedMonth} year={selectedYear} />
      </div>
      {/* KPI Cards — 5 kolom */}
      <section className="grid shrink-0 grid-cols-2 gap-2.5 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          title="Total Stok Tersedia"
          value={dashboard.totalStokTersedia}
          suffix="pcs"
          iconSrc="/icons/icon-stok.svg"
          delta={stokDelta}
        />
        <KpiCard
          title={`Barang Keluar ${chartMeta.bulan}`}
          value={dashboard.totalBarangKeluarBulanIni}
          suffix="pcs"
          iconSrc="/icons/icon-barangkeluar-merah.svg"
          subtitle={topMerchSubtitle}
          subtitleTone="accent"
          delta={keluarDelta}
        />
        <KpiCard
          title={`Transaksi ${chartMeta.bulan}`}
          value={dashboard.transaksiBulanIni.total}
          suffix="transaksi"
          iconSrc="/icons/icon-transaksi-merah.svg"
          delta={transaksiDelta}
          footer={
            <p className="text-[10px] leading-snug">
              <span className="font-medium text-[#059669]">
                {dashboard.transaksiBulanIni.masuk} Masuk
              </span>
              <span className="text-[#9CA3AF]"> · </span>
              <span className="font-medium text-[#D71920]">
                {dashboard.transaksiBulanIni.keluar} Keluar
              </span>
            </p>
          }
        />
        <KpiCard
          title="Distribusi Hari Ini"
          value={dashboard.distribusiHariIni}
          suffix="pcs"
          icon={<Truck size={18} className="text-[#D71920]" />}
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
          href={dashboard.peringatanStokRendah > 0 ? "/merchandise" : undefined}
        />
      </section>

      {/* Charts 2×2 */}
      <section className="grid min-h-0 flex-1 grid-cols-1 gap-2.5 lg:grid-cols-2">
        <ChartPanel
          title="Top 5 Stasiun Teraktif"
          subtitle={`Distribusi ${periodLabel}`}
          href="/barang-keluar"
        >
          <DashboardBarChart
            data={chartStasiun}
            layout="horizontal"
            emptyMessage="Belum ada distribusi"
          />
        </ChartPanel>

        <ChartPanel
          title="Trend Distribusi per Bulan"
          subtitle={`Jan – Des ${chartMeta.tahun} · periode ${periodLabel}`}
          href="/riwayat-transaksi"
        >
          <DashboardBarChart
            data={chartTrend}
            layout="vertical"
            emptyMessage="Belum ada tren distribusi"
            compactXLabels
          />
        </ChartPanel>

        <ChartPanel
          title="Top 5 Merchandise Didistribusikan"
          subtitle="Keseluruhan periode"
          href="/barang-keluar"
        >
          <DashboardBarChart
            data={chartMerch}
            layout="vertical"
            emptyMessage="Belum ada merchandise didistribusikan"
            compactXLabels
          />
        </ChartPanel>

        <ChartPanel
          title="Penggunaan Berdasarkan Kategori"
          subtitle={`Distribusi ${periodLabel}`}
          href="/riwayat-transaksi"
        >
          <CategoryPieChart data={dashboard.penggunaanKategori} />
        </ChartPanel>
      </section>

      {/* Stok Gudang Pusat */}
      <section className="shrink-0 rounded-xl border border-[#EFEAE5] bg-white px-4 py-2.5">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package size={14} className="text-[#D71920]" />
            <h3 className="text-sm font-semibold text-[#1A1A1A]">
              Ringkasan Stok Gudang Pusat
            </h3>
          </div>
          <Link
            href="/merchandise"
            className="flex items-center gap-0.5 text-xs font-medium text-[#D71920] hover:underline"
          >
            Kelola Merchandise
            <ChevronRight size={14} />
          </Link>
        </div>

        {dashboard.stokGudang.length === 0 ? (
          <p className="text-xs text-[#6B7280]">Belum ada data stok</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {dashboard.stokGudang.map((item) => {
              const maxRef = Math.max(
                ...dashboard.stokGudang.map((s) => s.stok),
                1
              );
              const fillRatio = item.stok / maxRef;

              return (
                <div
                  key={item.id}
                  className="rounded-lg border border-[#E8E4DF] bg-[#FAFAFA] px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#FFF5F5]">
                      <ShoppingBag size={13} className="text-[#D32F2F]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-medium text-[#4A4A4A]">
                        {item.nama}
                      </p>
                      <p className="text-sm font-bold text-[#1A1A1A]">
                        {item.stok}{" "}
                        <span className="text-[10px] font-normal text-[#9A9A9A]">
                          pcs
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[#F3F4F6]">
                    <div
                      className="h-full rounded-full bg-[#D32F2F]"
                      style={{ width: `${fillRatio * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
      className={`h-full rounded-xl border p-3 ${
        isDanger
          ? "border-[#B1070E] bg-[#B01B1C] text-white"
          : "border-[#EFEAE5] bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p
            className={`text-[10px] font-semibold uppercase tracking-wide ${
              isDanger ? "text-white/90" : "text-[#6B7280]"
            }`}
          >
            {title}
          </p>
          <div className="mt-1 flex items-end gap-1">
            <p
              className={`text-xl font-bold ${
                isDanger ? "text-white" : "text-[#1A1A1A]"
              }`}
            >
              {typeof value === "number"
                ? value.toLocaleString("id-ID")
                : value}
            </p>
            {suffix && (
              <span
                className={`pb-0.5 text-[11px] ${
                  isDanger ? "text-white/80" : "text-[#6B7280]"
                }`}
              >
                {suffix}
              </span>
            )}
          </div>

          {delta && (
            <p className={`mt-0.5 text-[10px] leading-snug ${deltaColor}`}>
              {delta.text}
            </p>
          )}

          {subtitle && (
            <p
              className={`mt-0.5 line-clamp-1 text-[10px] leading-snug ${
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

          {footer && <div className="mt-0.5">{footer}</div>}
        </div>

        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            isDanger ? "bg-white/20" : "bg-[#FFF2F2]"
          }`}
        >
          {iconSrc ? (
            <IconImage
              src={iconSrc}
              size={17}
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
  children,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#EFEAE5] bg-white">
      <div className="flex shrink-0 items-start justify-between px-4 pt-3 pb-1">
        <div>
          <h3 className="text-sm font-semibold text-[#1A1A1A]">{title}</h3>
          {subtitle && (
            <p className="text-[10px] text-[#9CA3AF]">{subtitle}</p>
          )}
        </div>
        {href && (
          <Link
            href={href}
            className="shrink-0 text-[10px] font-semibold text-[#D71920] hover:underline"
          >
            Lihat Semua
          </Link>
        )}
      </div>
      <div className="min-h-0 flex-1 px-3 pb-3 pt-1">{children}</div>
    </div>
  );
}
