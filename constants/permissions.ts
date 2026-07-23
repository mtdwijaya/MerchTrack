
export const PAGE_KEYS = [
  "dashboard",
  "barang-keluar",
  "monitoring",
  "riwayat-transaksi",
  "tujuan",
  "unit",
  "stasiun",
  "merchandise",
  "pengguna",
] as const;

export type PageKey = (typeof PAGE_KEYS)[number];

export type AppPageDef = {
  key: PageKey;
  href: string;
  label: string;
  icon: string;
  /** Section sidebar: main navigasi vs master data */
  section: "main" | "master";
  /** Default allowed untuk role (bisa diubah lewat RolePermission) */
  defaultAllowed: {
    ADMIN: boolean;
    PETUGAS: boolean;
  };
};

export const APP_PAGES: AppPageDef[] = [
  {
    key: "dashboard",
    href: "/admin",
    label: "Dashboard",
    icon: "/icons/icon-dashboard.svg",
    section: "main",
    defaultAllowed: { ADMIN: true, PETUGAS: true },
  },
  {
    key: "barang-keluar",
    href: "/admin/barang-keluar",
    label: "Transaksi Barang Keluar",
    icon: "/icons/icon-barangkeluar.svg",
    section: "main",
    defaultAllowed: { ADMIN: true, PETUGAS: true },
  },
  {
    key: "monitoring",
    href: "/admin/monitoring",
    label: "Monitoring Merchandise",
    icon: "/icons/icon-monitoring.svg",
    section: "main",
    defaultAllowed: { ADMIN: true, PETUGAS: true },
  },
  {
    key: "riwayat-transaksi",
    href: "/admin/riwayat-transaksi",
    label: "Riwayat Transaksi",
    icon: "/icons/icon-riwayat.svg",
    section: "main",
    defaultAllowed: { ADMIN: true, PETUGAS: true },
  },
  {
    key: "tujuan",
    href: "/admin/tujuan",
    label: "Tujuan",
    icon: "/icons/icon-tujuan.svg",
    section: "master",
    defaultAllowed: { ADMIN: true, PETUGAS: false },
  },
  {
    key: "unit",
    href: "/admin/tujuan/unit",
    label: "Unit",
    icon: "/icons/icon-unit.svg",
    section: "master",
    defaultAllowed: { ADMIN: true, PETUGAS: false },
  },
  {
    key: "stasiun",
    href: "/admin/tujuan/stasiun",
    label: "Stasiun",
    icon: "/icons/icon-stasiun.svg",
    section: "master",
    defaultAllowed: { ADMIN: true, PETUGAS: false },
  },
  {
    key: "merchandise",
    href: "/admin/merchandise",
    label: "Merchandise",
    icon: "/icons/icon-merchandise.svg",
    section: "master",
    defaultAllowed: { ADMIN: true, PETUGAS: false },
  },
  {
    key: "pengguna",
    href: "/admin/pengguna",
    label: "Pengguna",
    icon: "/icons/icon-kelolapengguna.svg",
    section: "master",
    defaultAllowed: { ADMIN: true, PETUGAS: false },
  },
];

export function isPageKey(value: string): value is PageKey {
  return (PAGE_KEYS as readonly string[]).includes(value);
}

export function getPageByHref(pathname: string): AppPageDef | undefined {
  const normalized = pathname.replace(/\/$/, "") || "/";
  // match longest href first (unit/stasiun di bawah /tujuan)
  const sorted = [...APP_PAGES].sort(
    (a, b) => b.href.length - a.href.length
  );
  return sorted.find(
    (page) =>
      normalized === page.href || normalized.startsWith(`${page.href}/`)
  );
}

export function getDefaultAllowed(
  role: "ADMIN" | "PETUGAS",
  pageKey: PageKey
): boolean {
  const page = APP_PAGES.find((item) => item.key === pageKey);
  return page?.defaultAllowed[role] ?? false;
}
