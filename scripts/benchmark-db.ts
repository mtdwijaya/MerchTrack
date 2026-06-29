/**
 * Benchmark query Prisma langsung (tanpa HTTP).
 * Usage: npx tsx scripts/benchmark-db.ts
 */

import "dotenv/config";

import { prisma } from "../lib/prisma";
import { getBarangKeluarPaginated } from "../lib/barang-keluar";
import { getRiwayatTransaksiPaginated } from "../lib/riwayat-transaksi";

const RUNS = 15;

async function bench(name: string, fn: () => Promise<unknown>) {
  await fn();
  await fn();

  const times: number[] = [];
  for (let i = 0; i < RUNS; i++) {
    const t0 = performance.now();
    await fn();
    times.push(performance.now() - t0);
  }

  times.sort((a, b) => a - b);
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const p95 = times[Math.floor(times.length * 0.95)] ?? times.at(-1)!;

  return {
    name,
    avg: Math.round(avg),
    p95: Math.round(p95),
    min: Math.round(times[0]),
    max: Math.round(times.at(-1)!),
  };
}

async function main() {
  console.log("\n=== Benchmark Query DB (Prisma) ===\n");

  const adminUser = { id_user: 1, id_stasiun: null, role: "ADMIN" as const };
  void adminUser;

  const cases = [
    {
      name: "kategoriPenggunaan.findMany",
      fn: () => prisma.kategoriPenggunaan.findMany({ orderBy: { nama_kategori: "asc" } }),
    },
    {
      name: "stasiun.findMany",
      fn: () => prisma.stasiun.findMany({ orderBy: { nama_stasiun: "asc" } }),
    },
    {
      name: "merchandise.findMany (dropdown)",
      fn: () =>
        prisma.merchandise.findMany({
          select: {
            id_merch: true,
            nama_merch: true,
            stok: { select: { jumlah_stok: true } },
          },
          orderBy: { nama_merch: "asc" },
        }),
    },
    {
      name: "dashboard aggregates (parallel)",
      fn: async () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        await Promise.all([
          prisma.merchandise.count(),
          prisma.stasiun.count(),
          prisma.stok.aggregate({ _sum: { jumlah_stok: true } }),
          prisma.barangKeluar.aggregate({
            where: { tanggal_keluar: { gte: start } },
            _sum: { jumlah: true },
          }),
        ]);
      },
    },
    {
      name: "monitoring groupBy + aggregate",
      fn: async () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        await Promise.all([
          prisma.stok.aggregate({ _sum: { jumlah_stok: true } }),
          prisma.barangKeluar.groupBy({ by: ["id_stasiun"] }),
          prisma.barangKeluar.aggregate({
            where: { tanggal_keluar: { gte: start, lte: end } },
            _sum: { jumlah: true },
          }),
        ]);
      },
    },
    {
      name: "getBarangKeluarPaginated",
      fn: () =>
        getBarangKeluarPaginated({ page: 1, limit: 10 }),
    },
    {
      name: "getRiwayatTransaksiPaginated",
      fn: () =>
        getRiwayatTransaksiPaginated({ page: 1, limit: 10 }),
    },
    {
      name: "prisma.barangKeluar.count",
      fn: () => prisma.barangKeluar.count(),
    },
  ];

  console.log(
    "Query".padEnd(36) + "Avg".padEnd(10) + "p95".padEnd(10) + "Min-Max"
  );
  console.log("-".repeat(66));

  const results = [];
  for (const c of cases) {
    const r = await bench(c.name, c.fn);
    results.push(r);
    console.log(
      r.name.padEnd(36) +
        `${r.avg}ms`.padEnd(10) +
        `${r.p95}ms`.padEnd(10) +
        `${r.min}-${r.max}ms`
    );
  }

  const slowest = [...results].sort((a, b) => b.p95 - a.p95)[0];
  console.log(`\nTerlambat: ${slowest.name} (p95 ${slowest.p95}ms)\n`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
