// kolom user yang aman untuk dikirim ke client (tanpa password)
export const userPublicSelect = {
  id_user: true,
  nama_user: true,
} as const;

export const barangKeluarListInclude = {
  merchandise: true,
  stasiun: true,
  kategori: true,
  user: { select: userPublicSelect },
} as const;

export const riwayatListInclude = {
  merchandise: true,
  kategori: true,
  stasiun: true,
  user: { select: userPublicSelect },
} as const;

export const recentBarangKeluarInclude = {
  merchandise: true,
  stasiun: true,
  user: { select: userPublicSelect },
} as const;

export const recentBarangMasukInclude = {
  merchandise: true,
  user: { select: userPublicSelect },
} as const;
