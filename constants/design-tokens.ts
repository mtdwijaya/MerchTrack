/** MerchTrack design tokens — warna & style semantik shared */

export const palette = {
  primary: "#D32F2F",
  primaryHover: "#C62828",
  primaryActive: "#B71C1C",
  primarySoft: "#EF9A9A",
  primaryTint: "#FFF5F5",
  surface: "#FFFFFF",
  pageBg: "#FAFAF8",
  textPrimary: "#1A1A1A",
  textSecondary: "#4A4A4A",
  textMuted: "#9A9A9A",
  border: "#E8E4DF",
} as const;

// badge + dot aktivitas dashboard (keluar, kembali, edit, restock)
export const activityTypeStyle = {
  keluar: {
    dot: "bg-[#D32F2F]",
    badge: "bg-[#FFF5F5] text-[#D32F2F]",
  },
  kembali: {
    dot: "bg-sky-700",
    badge: "bg-sky-50 text-sky-700",
  },
  edit: {
    dot: "bg-amber-600",
    badge: "bg-amber-50 text-amber-700",
  },
  restock: {
    dot: "bg-emerald-600",
    badge: "bg-emerald-50 text-emerald-700",
  },
} as const;

// warna badge status transaksi barang keluar
export const statusBarangKeluarStyle = {
  AKTIF: "bg-emerald-50 text-emerald-700",
  SEBAGIAN_KEMBALI: "bg-orange-100 text-orange-700",
  LUNAS_KEMBALI: "bg-[#FFF5F5] text-[#C62828]",
} as const;

// warna badge status stok gudang
export const stockStatusStyle = {
  normal: {
    badge: "bg-emerald-50 text-emerald-700",
    label: "Normal",
  },
  rendah: {
    badge: "bg-orange-50 text-orange-500",
    label: "Rendah",
  },
  habis: {
    badge: "bg-red-100 text-red-700",
    label: "Habis",
  },
} as const;

// link aksen di panel dashboard
export const dashboardLink =
  "text-[10px] font-semibold text-[#D32F2F] hover:text-[#C62828] hover:underline";
