import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";

/** Opsi nama petugas untuk dropdown akses cepat (dari master pengguna + riwayat) */
async function fetchPetugasNameOptions() {
  const [users, keluar, masuk] = await Promise.all([
    prisma.user.findMany({
      select: { nama_user: true },
      orderBy: { nama_user: "asc" },
    }),
    prisma.barangKeluar.findMany({
      where: { nama_petugas: { not: null } },
      select: { nama_petugas: true },
      distinct: ["nama_petugas"],
      take: 100,
    }),
    prisma.barangMasuk.findMany({
      where: { nama_petugas: { not: null } },
      select: { nama_petugas: true },
      distinct: ["nama_petugas"],
      take: 100,
    }),
  ]);

  const names = new Set<string>();
  for (const user of users) {
    const name = user.nama_user.trim();
    if (name) names.add(name);
  }
  for (const row of [...keluar, ...masuk]) {
    const name = row.nama_petugas?.trim();
    if (name) names.add(name);
  }

  return [...names].sort((a, b) => a.localeCompare(b, "id"));
}

export const getPetugasNameOptions = unstable_cache(
  fetchPetugasNameOptions,
  ["petugas-name-options"],
  { revalidate: 60 }
);
