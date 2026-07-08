export interface SidebarMenu {
  name: string;
  href: string;
  icon: string;
}

export const sidebarMenus = {
  ADMIN: {
    main: [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: "/icons/icon-dashboard.svg",
      },
      {
        name: "Barang Keluar",
        href: "/barang-keluar",
        icon: "/icons/icon-barangkeluar.svg",
      },
      {
        name: "Monitoring",
        href: "/monitoring",
        icon: "/icons/icon-monitoring.svg",
      },
      {
        name: "Laporan",
        href: "/laporan",
        icon: "/icons/icon-laporan.svg",
      },
      {
        name: "Riwayat Transaksi",
        href: "/riwayat-transaksi",
        icon: "/icons/icon-riwayat.svg",
      },
    ],

    master: [
      {
        name: "Stasiun",
        href: "/stasiun",
        icon: "/icons/icon-stasiun.svg",
      },
      {
        name: "Merchandise",
        href: "/merchandise",
        icon: "/icons/icon-merchandise.svg",
      },
      {
        name: "Pengguna",
        href: "/pengguna",
        icon: "/icons/icon-kelolapengguna.svg",
      },
    ],
  },

  PETUGAS: {
    main: [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: "/icons/icon-dashboard.svg",
      },
      {
        name: "Barang Keluar",
        href: "/barang-keluar",
        icon: "/icons/icon-barangkeluar.svg",
      },
      {
        name: "Monitoring",
        href: "/monitoring",
        icon: "/icons/icon-monitoring.svg",
      },
      {
        name: "Laporan",
        href: "/laporan",
        icon: "/icons/icon-laporan.svg",
      },
      {
        name: "Riwayat Transaksi",
        href: "/riwayat-transaksi",
        icon: "/icons/icon-riwayat.svg",
      },

    ],

    master: [],
  },
};