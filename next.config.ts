import type { NextConfig } from "next";

/** Host LAN untuk uji di tablet (next dev). Tambah IP PC Anda bila berubah. */
const lanDevHosts = [
  "localhost",
  "127.0.0.1",
  "10.45.4.175",
  "192.168.45.3",
];

const nextConfig: NextConfig = {
  // Izinkan HMR / resource dev dari akses via IP (bukan hanya localhost)
  allowedDevOrigins: lanDevHosts,
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
      // Izinkan Server Action dari Origin tablet/LAN
      allowedOrigins: lanDevHosts.flatMap((host) => [
        host,
        `${host}:3000`,
      ]),
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
