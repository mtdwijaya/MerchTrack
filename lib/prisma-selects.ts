export const userPublicSelect = {
  id_user: true,
  nama_user: true,
} as const;

export const barangKeluarListInclude = {
  merchandise: true,
  stasiun: true,
  unit: true,
  tujuan: true,
  user: { select: userPublicSelect },
} as const;

export const riwayatListInclude = {
  merchandise: true,
  tujuan: true,
  stasiun: true,
  unit: true,
  user: { select: userPublicSelect },
} as const;

export const recentBarangKeluarInclude = {
  merchandise: true,
  stasiun: true,
  unit: true,
  tujuan: true,
  user: { select: userPublicSelect },
} as const;

export const recentBarangMasukInclude = {
  merchandise: true,
  user: { select: userPublicSelect },
} as const;

export const recentBarangKembaliInclude = {
  user: { select: userPublicSelect },
  barangKeluar: {
    include: {
      merchandise: true,
      tujuan: true,
      stasiun: true,
      unit: true,
    },
  },
} as const;
