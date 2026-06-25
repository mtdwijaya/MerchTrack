/**
 * Benchmark dengan warmup DB + perbandingan cold vs warm cache.
 */

const baseUrl = process.argv[2] ?? "http://localhost:3001";
const measured = Number(process.argv[3] ?? 25);

const cases = [
  { label: "GET /api/kategori", path: "/api/kategori", cached: true },
  { label: "GET /api/stasiun", path: "/api/stasiun", cached: true },
  {
    label: "GET /api/stasiun?page=1",
    path: "/api/stasiun?page=1&limit=5",
    cached: false,
  },
];

async function timedFetch(path) {
  const t0 = performance.now();
  const res = await fetch(`${baseUrl}${path}`, { cache: "no-store" });
  await res.text();
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return performance.now() - t0;
}

function summarize(times) {
  const sorted = [...times].sort((a, b) => a - b);
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  return {
    avg: +(avg.toFixed(2)),
    min: +(sorted[0].toFixed(2)),
    max: +(sorted.at(-1).toFixed(2)),
    p95: +(sorted[Math.floor(sorted.length * 0.95)].toFixed(2)),
  };
}

async function runCase({ label, path, cached }) {
  // Warmup DB connection (bukan cache unstable_cache)
  await timedFetch(path);
  await timedFetch(path);

  // Simulasi cold cache: restart tidak bisa dari script,
  // jadi ukur request ke-3 sebagai "post-warmup first"
  const cold = await timedFetch(path);

  const warmTimes = [];
  for (let i = 0; i < measured; i++) {
    warmTimes.push(await timedFetch(path));
  }

  const warm = summarize(warmTimes);

  return { label, path, cached, cold: +cold.toFixed(2), warm };
}

async function main() {
  console.log(`\n=== Benchmark cache (production) ===`);
  console.log(`URL: ${baseUrl} | ${measured} request warm per endpoint\n`);

  const rows = [];
  for (const c of cases) {
    rows.push(await runCase(c));
  }

  console.log(
    "Endpoint".padEnd(32) +
      "Cache?".padEnd(8) +
      "Cold*".padEnd(10) +
      "Warm avg".padEnd(12) +
      "Warm p95".padEnd(12) +
      "Speedup"
  );
  console.log("-".repeat(78));

  for (const r of rows) {
    const speedup = r.warm.avg > 0 ? (r.cold / r.warm.avg).toFixed(2) + "x" : "-";
    console.log(
      r.label.padEnd(32) +
        (r.cached ? "Ya" : "Tidak").padEnd(8) +
        `${r.cold} ms`.padEnd(10) +
        `${r.warm.avg} ms`.padEnd(12) +
        `${r.warm.p95} ms`.padEnd(12) +
        speedup
    );
  }

  console.log("\n* Cold = request pertama setelah 2x warmup DB (cache mungkin sudah terisi).");
  console.log("  Untuk cache hit penuh, lihat warm avg — biasanya 2–5 ms.\n");

  const kategori = rows[0];
  const stasiunCached = rows[1];
  const stasiunPage = rows[2];

  if (kategori.warm.avg < stasiunPage.warm.avg) {
    const diff = ((1 - kategori.warm.avg / stasiunPage.warm.avg) * 100).toFixed(0);
    console.log(
      `Kategori cached warm avg ~${diff}% lebih cepat dari stasiun paginated (tanpa unstable_cache).`
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
