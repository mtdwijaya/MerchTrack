import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.45.3", "192.168.*.*"],
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  async redirects() {
    return [
      { source: "/dashboard", destination: "/admin", permanent: false },
      {
        source: "/dashboard/:path*",
        destination: "/admin/:path*",
        permanent: false,
      },
      {
        source: "/barang-keluar",
        destination: "/admin/barang-keluar",
        permanent: false,
      },
      {
        source: "/barang-keluar/:path*",
        destination: "/admin/barang-keluar/:path*",
        permanent: false,
      },
      {
        source: "/monitoring",
        destination: "/admin/monitoring",
        permanent: false,
      },
      {
        source: "/monitoring/:path*",
        destination: "/admin/monitoring/:path*",
        permanent: false,
      },
      {
        source: "/riwayat-transaksi",
        destination: "/admin/riwayat-transaksi",
        permanent: false,
      },
      {
        source: "/merchandise",
        destination: "/admin/merchandise",
        permanent: false,
      },
      {
        source: "/pengguna",
        destination: "/admin/pengguna",
        permanent: false,
      },
      { source: "/tujuan", destination: "/admin/tujuan", permanent: false },
      {
        source: "/tujuan/:path*",
        destination: "/admin/tujuan/:path*",
        permanent: false,
      },
      { source: "/laporan", destination: "/admin/laporan", permanent: false },
    ];
  },
};

export default nextConfig;
