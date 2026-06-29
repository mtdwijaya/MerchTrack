import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // izinkan akses dev server via ip jaringan lokal (next.js 16 blokir cross-origin dev assets)
  allowedDevOrigins: ["192.168.45.3", "192.168.*.*"],
};

export default nextConfig;
