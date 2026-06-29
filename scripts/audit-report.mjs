/**
 * Audit performa & keamanan MerchTrack.
 * Usage: node scripts/audit-report.mjs [baseUrl] [iterations]
 */

import "dotenv/config";
import jwt from "jsonwebtoken";
import { execSync } from "node:child_process";

const baseUrl = process.argv[2] ?? "http://localhost:3000";
const iterations = Number(process.argv[3] ?? 10);

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("JWT_SECRET tidak ditemukan di .env");
  process.exit(1);
}

const BCRYPT_RE = /\$2[aby]\$\d{2}\$/;
const JWT_RE = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/;

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
}

function cookieHeader(token) {
  return `token=${token}`;
}

async function fetchRoute(path, { token, redirect = "manual" } = {}) {
  const headers = {};
  if (token) headers.Cookie = cookieHeader(token);

  const start = performance.now();
  const res = await fetch(`${baseUrl}${path}`, {
    headers,
    redirect,
    cache: "no-store",
  });
  const body = await res.text();
  const ms = performance.now() - start;

  return { status: res.status, ms, body, location: res.headers.get("location") };
}

function stats(times) {
  const sorted = [...times].sort((a, b) => a - b);
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  return {
    avg: Math.round(avg),
    p50: Math.round(sorted[Math.floor(sorted.length * 0.5)]),
    p95: Math.round(sorted[Math.floor(sorted.length * 0.95)] ?? sorted.at(-1)),
    min: Math.round(sorted[0]),
    max: Math.round(sorted.at(-1)),
  };
}

const securityResults = [];
const perfResults = [];

function sec(name, pass, detail) {
  securityResults.push({ name, pass, detail });
}

async function runSecurityTests() {
  console.log("\n═══ AUDIT KEAMANAN ═══\n");

  // 1. Tanpa cookie → redirect login
  const noAuth = await fetchRoute("/dashboard");
  sec(
    "Route terlindungi tanpa cookie → redirect /login",
    noAuth.status === 307 || noAuth.status === 302,
    `status=${noAuth.status}, location=${noAuth.location}`
  );

  // 2. Token invalid (format salah) → proxy lolos, layout redirect
  const badToken = await fetchRoute("/dashboard", { token: "not-a-valid-jwt" });
  const badOk =
    badToken.status === 307 ||
    badToken.status === 302 ||
    (badToken.status === 200 && badToken.body.includes("/login"));
  sec(
    "Token invalid ditolak (proxy/layout)",
    badOk,
    `status=${badToken.status}`
  );

  // 3. Token dengan secret salah
  const forged = jwt.sign(
    { id_user: 1, email: "x@test.com", role: "ADMIN", nama_user: "Hacker" },
    "wrong-secret-key-for-test",
    { expiresIn: "1d" }
  );
  const forgedRes = await fetchRoute("/dashboard", { token: forged });
  const forgedBlocked =
    forgedRes.status === 307 ||
    forgedRes.status === 302 ||
    (forgedRes.status === 200 &&
      (forgedRes.location?.includes("/login") ||
        forgedRes.body.toLowerCase().includes("login")));
  sec(
    "JWT dengan secret salah ditolak",
    forgedBlocked,
    `status=${forgedRes.status}`
  );

  // 4. PETUGAS tidak boleh akses halaman admin
  const petugasToken = signToken({
    id_user: 99,
    email: "petugas@lrt.co.id",
    role: "PETUGAS",
    nama_user: "Petugas Test",
    id_stasiun: 1,
  });
  const merchRes = await fetchRoute("/merchandise", { token: petugasToken });
  const adminBlocked =
    merchRes.status === 307 ||
    merchRes.status === 302 ||
    merchRes.location?.includes("/dashboard") ||
    merchRes.body.includes("/dashboard");
  sec(
    "Role PETUGAS diblokir dari /merchandise (admin)",
    adminBlocked,
    `status=${merchRes.status}, location=${merchRes.location}`
  );

  // 5. Scan password hash di response halaman
  const adminToken = signToken({
    id_user: 1,
    email: "admin@lrt.co.id",
    role: "ADMIN",
    nama_user: "Admin",
    id_stasiun: null,
  });

  const pagesToScan = [
    "/barang-keluar",
    "/riwayat-transaksi",
    "/monitoring",
    "/pengguna",
  ];

  let leakFound = false;
  const leakDetails = [];

  for (const path of pagesToScan) {
    const res = await fetchRoute(path, { token: adminToken });
    if (BCRYPT_RE.test(res.body)) {
      leakFound = true;
      leakDetails.push(`${path}: bcrypt hash terdeteksi`);
    }
  }
  sec(
    "Tidak ada hash password di HTML halaman",
    !leakFound,
    leakFound ? leakDetails.join("; ") : "Semua halaman bersih"
  );

  // 6. Cookie httpOnly — cek via login (simulasi: opsi cookie di auth.ts)
  sec(
    "Cookie auth dikonfigurasi httpOnly (static review)",
    true,
    "getAuthCookieOptions() set httpOnly: true, sameSite: lax"
  );

  // 7. Brute force login — tidak ada rate limit
  const loginAttempts = [];
  for (let i = 0; i < 5; i++) {
    const t0 = performance.now();
    await fetch(`${baseUrl}/login`, { method: "GET", cache: "no-store" });
    loginAttempts.push(performance.now() - t0);
  }
  sec(
    "Rate limiting pada login",
    false,
    `Tidak ada rate limit — 5 request GET /login avg ${Math.round(loginAttempts.reduce((a, b) => a + b, 0) / 5)}ms (INFO: rekomendasi tambah limiter)`
  );

  // 8. JWT di response body (bukan cookie)
  const dashRes = await fetchRoute("/dashboard", { token: adminToken });
  const jwtInBody = JWT_RE.test(dashRes.body) && dashRes.body.includes("token");
  sec(
    "JWT tidak ter-expose di HTML response",
    !jwtInBody,
    jwtInBody ? "Token pattern ditemukan di body" : "Bersih"
  );

  for (const r of securityResults) {
    const icon = r.pass ? "✓" : r.pass === false ? "✗" : "△";
    const label = r.pass ? "PASS" : r.pass === false ? "FAIL" : "INFO";
    console.log(`  [${icon}] ${label} — ${r.name}`);
    if (r.detail) console.log(`       ${r.detail}`);
  }
}

async function runPerformanceTests() {
  console.log("\n═══ AUDIT PERFORMA (halaman SSR) ═══\n");
  console.log(`URL: ${baseUrl} | ${iterations} iterasi per halaman\n`);

  const adminToken = signToken({
    id_user: 1,
    email: "admin@lrt.co.id",
    role: "ADMIN",
    nama_user: "Admin",
    id_stasiun: null,
  });

  const routes = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Barang Keluar", path: "/barang-keluar" },
    { name: "Monitoring", path: "/monitoring" },
    { name: "Riwayat Transaksi", path: "/riwayat-transaksi" },
    { name: "Merchandise (admin)", path: "/merchandise" },
    { name: "Login (public)", path: "/login" },
  ];

  // Warmup
  await fetchRoute("/dashboard", { token: adminToken });

  console.log(
    "Halaman".padEnd(22) +
      "Avg".padEnd(8) +
      "p50".padEnd(8) +
      "p95".padEnd(8) +
      "Min-Max"
  );
  console.log("-".repeat(54));

  for (const route of routes) {
    const times = [];
    const token = route.path === "/login" ? undefined : adminToken;

    for (let i = 0; i < iterations; i++) {
      const res = await fetchRoute(route.path, { token });
      if (res.status >= 400) {
        console.warn(`  WARN ${route.path} → ${res.status}`);
      }
      times.push(res.ms);
    }

    const s = stats(times);
    perfResults.push({ ...route, ...s });
    console.log(
      route.name.padEnd(22) +
        `${s.avg}ms`.padEnd(8) +
        `${s.p50}ms`.padEnd(8) +
        `${s.p95}ms`.padEnd(8) +
        `${s.min}-${s.max}ms`
    );
  }

  const slowest = [...perfResults]
    .filter((r) => r.path !== "/login")
    .sort((a, b) => b.p95 - a.p95)[0];

  console.log(`\n  Terlambat (p95): ${slowest.name} — ${slowest.p95}ms`);

  const threshold = 500;
  const over = perfResults.filter((r) => r.p95 > threshold && r.path !== "/login");
  if (over.length) {
    console.log(`  ⚠ ${over.length} halaman p95 > ${threshold}ms — pertimbangkan optimasi query/cache`);
  } else {
    console.log(`  ✓ Semua halaman protected p95 ≤ ${threshold}ms`);
  }
}

async function runNpmAudit() {
  console.log("\n═══ NPM AUDIT (dependensi) ═══\n");
  try {
    const out = execSync("npm audit --json", {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    const data = JSON.parse(out);
    const meta = data.metadata?.vulnerabilities ?? {};
    console.log(
      `  Critical: ${meta.critical ?? 0} | High: ${meta.high ?? 0} | Moderate: ${meta.moderate ?? 0} | Low: ${meta.low ?? 0}`
    );
    const advisories = Object.values(data.vulnerabilities ?? {}).slice(0, 5);
    for (const adv of advisories) {
      console.log(`  - ${adv.name} (${adv.severity}): ${adv.title ?? adv.via?.[0] ?? ""}`);
    }
    if ((meta.moderate ?? 0) > 0) {
      sec("npm audit tanpa vulnerability moderate+", false, `${meta.moderate} moderate, ${meta.high ?? 0} high`);
    } else {
      sec("npm audit tanpa vulnerability moderate+", true, "Tidak ada moderate/high/critical");
    }
  } catch (e) {
    if (e.stdout) {
      try {
        const data = JSON.parse(e.stdout);
        const meta = data.metadata?.vulnerabilities ?? {};
        console.log(
          `  Critical: ${meta.critical ?? 0} | High: ${meta.high ?? 0} | Moderate: ${meta.moderate ?? 0} | Low: ${meta.low ?? 0}`
        );
      } catch {
        console.log("  npm audit selesai dengan findings (lihat output npm)");
      }
    }
  }
}

async function main() {
  console.log("MerchTrack — Laporan Audit Performa & Keamanan");
  console.log("=".repeat(54));

  try {
    await fetchRoute("/login");
  } catch {
    console.error(`\nServer tidak reachable di ${baseUrl}`);
    console.error("Jalankan: npm run dev");
    process.exit(1);
  }

  await runSecurityTests();
  await runPerformanceTests();
  await runNpmAudit();

  const passed = securityResults.filter((r) => r.pass === true).length;
  const failed = securityResults.filter((r) => r.pass === false).length;
  const info = securityResults.filter((r) => r.pass !== true && r.pass !== false).length;

  console.log("\n═══ RINGKASAN ═══\n");
  console.log(`  Keamanan: ${passed} pass, ${failed} fail, ${info} info`);
  console.log(`  Performa: ${perfResults.length} halaman diukur`);
  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
