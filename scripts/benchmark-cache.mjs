/**
 * Benchmark cache: bandingkan endpoint cached vs non-cached.
 * Usage: node scripts/benchmark-cache.mjs [baseUrl] [iterations]
 */

const baseUrl = process.argv[2] ?? "http://localhost:3001";
const iterations = Number(process.argv[3] ?? 15);

const endpoints = [
  { name: "Kategori (cached)", path: "/api/kategori" },
  { name: "Stasiun list (cached)", path: "/api/stasiun" },
  { name: "Stasiun paginated (no cache)", path: "/api/stasiun?page=1&limit=5" },
];

async function fetchOnce(path) {
  const start = performance.now();
  const res = await fetch(`${baseUrl}${path}`, {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" },
  });
  const body = await res.text();
  const ms = performance.now() - start;

  if (!res.ok) {
    throw new Error(`${path} → ${res.status}: ${body.slice(0, 120)}`);
  }

  return ms;
}

function stats(times) {
  const sorted = [...times].sort((a, b) => a - b);
  const sum = times.reduce((a, b) => a + b, 0);
  const avg = sum / times.length;
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? sorted.at(-1);

  return {
    first: times[0],
    avg: Math.round(avg * 100) / 100,
    min: Math.round(sorted[0] * 100) / 100,
    max: Math.round(sorted.at(-1) * 100) / 100,
    p50: Math.round(p50 * 100) / 100,
    p95: Math.round(p95 * 100) / 100,
    warmAvg:
      times.length > 1
        ? Math.round(
            (times.slice(1).reduce((a, b) => a + b, 0) / (times.length - 1)) *
              100
          ) / 100
        : null,
  };
}

async function benchmarkEndpoint({ name, path }) {
  const times = [];

  for (let i = 0; i < iterations; i++) {
    times.push(await fetchOnce(path));
  }

  const s = stats(times);
  const speedup =
    s.warmAvg && s.first > 0
      ? Math.round((s.first / s.warmAvg) * 100) / 100
      : null;

  return { name, path, iterations, ...s, speedup };
}

async function main() {
  console.log(`\nBenchmark cache — ${baseUrl}`);
  console.log(`Iterasi per endpoint: ${iterations}\n`);
  console.log("─".repeat(72));

  try {
    await fetchOnce("/api/kategori");
  } catch (error) {
    console.error(`Server tidak reachable di ${baseUrl}`);
    console.error(error.message);
    process.exit(1);
  }

  const results = [];
  for (const endpoint of endpoints) {
    const result = await benchmarkEndpoint(endpoint);
    results.push(result);

    console.log(`\n${result.name}`);
    console.log(`  Path       : ${result.path}`);
    console.log(`  Request #1 : ${result.first.toFixed(2)} ms (cold)`);
    if (result.warmAvg != null) {
      console.log(`  Warm avg   : ${result.warmAvg.toFixed(2)} ms (#2–#${iterations})`);
      if (result.speedup != null && result.speedup > 1) {
        console.log(`  Speedup    : ~${result.speedup}x lebih cepat setelah cache`);
      }
    }
    console.log(`  Avg        : ${result.avg.toFixed(2)} ms`);
    console.log(`  p50 / p95  : ${result.p50.toFixed(2)} / ${result.p95.toFixed(2)} ms`);
    console.log(`  Min / Max  : ${result.min.toFixed(2)} / ${result.max.toFixed(2)} ms`);
  }

  console.log("\n" + "─".repeat(72));
  console.log("\nRingkasan perbandingan (warm avg):\n");

  const cached = results.filter((r) => r.name.includes("cached"));
  const uncached = results.find((r) => r.name.includes("no cache"));

  for (const r of cached) {
    const vs =
      uncached && r.warmAvg
        ? ` (vs paginated warm: ${uncached.warmAvg.toFixed(2)} ms)`
        : "";
    console.log(`  ${r.name.padEnd(28)} ${r.warmAvg?.toFixed(2) ?? "-"} ms${vs}`);
  }

  if (uncached) {
    console.log(`  ${uncached.name.padEnd(28)} ${uncached.warmAvg?.toFixed(2) ?? "-"} ms`);
  }

  console.log("");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
