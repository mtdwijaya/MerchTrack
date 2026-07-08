/** MerchTrack design tokens — primitive & semantic palette */
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

/** Badge & dot untuk jenis aktivitas — selaras status badge transaksi */
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

/** Badge status transaksi barang keluar */
export const statusBarangKeluarStyle = {
  AKTIF: "bg-emerald-50 text-emerald-700",
  SEBAGIAN_KEMBALI: "bg-orange-100 text-orange-700",
  LUNAS_KEMBALI: "bg-[#FFF5F5] text-[#C62828]",
} as const;

/** badge status stok gudang */
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

/** Link aksen di panel dashboard */
export const dashboardLink =
  "text-[10px] font-semibold text-[#D32F2F] hover:text-[#C62828] hover:underline";

/** Shared Tailwind class strings for action buttons */
export const actionButton = {
  outline:
    "rounded-lg border border-[#E8E4DF] bg-white px-3 py-1.5 text-sm font-medium text-[#4A4A4A] transition-colors hover:border-[#D32F2F] hover:bg-[#FFF5F5] hover:text-[#D32F2F]",
  outlineMd:
    "rounded-lg border border-[#E8E4DF] bg-white px-4 py-2 text-sm font-medium text-[#4A4A4A] transition-colors hover:border-[#D32F2F] hover:bg-[#FFF5F5] hover:text-[#D32F2F]",
  primary:
    "inline-flex items-center justify-center gap-2 rounded-lg bg-[#D32F2F] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#C62828] active:bg-[#B71C1C]",
  destructive:
    "rounded-lg border border-[#E8E4DF] bg-white px-4 py-2 text-sm font-medium text-[#B71C1C] transition-colors hover:border-[#D32F2F] hover:bg-[#FFF5F5] hover:text-[#D32F2F]",
  icon:
    "flex h-8 w-8 items-center justify-center rounded-lg border border-[#E8E4DF] bg-white text-[#4A4A4A] transition-colors hover:border-[#D32F2F] hover:bg-[#FFF5F5] hover:text-[#D32F2F]",
  iconDestructive:
    "flex h-8 w-8 items-center justify-center rounded-lg border border-[#E8E4DF] bg-white text-[#B71C1C] transition-colors hover:border-[#D32F2F] hover:bg-[#FFF5F5] hover:text-[#D32F2F]",
  textLink:
    "text-sm font-medium text-[#4A4A4A] transition-colors hover:text-[#D32F2F] hover:underline",
  textDestructive:
    "text-sm font-medium text-[#B71C1C] transition-colors hover:text-[#D32F2F] hover:underline",
} as const;
