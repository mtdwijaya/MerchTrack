import { prisma } from "@/lib/prisma";
import { userPublicSelect } from "@/lib/prisma-selects";
import { resolveNamaPetugas } from "@/lib/nama-petugas";

const barangMasukInclude = {
  merchandise: true,
  user: { select: userPublicSelect },
} as const;

export async function getBarangMasukById(id: number) {
  return prisma.barangMasuk.findUnique({
    where: { id_masuk: id },
    include: barangMasukInclude,
  });
}

export async function getBarangMasukDetail(id: number) {
  const data = await getBarangMasukById(id);
  if (!data) return null;

  const namaPetugas = (data as { nama_petugas?: string | null }).nama_petugas;

  return {
    id_masuk: data.id_masuk,
    tanggal_masuk: data.tanggal_masuk.toISOString(),
    keterangan: data.keterangan,
    jumlah: data.jumlah,
    merchandise: data.merchandise.nama_merch,
    petugas: resolveNamaPetugas(namaPetugas, data.user.nama_user),
    nama_petugas: namaPetugas ?? null,
    bukti_path: data.bukti_path,
    bukti_nama: data.bukti_nama,
  };
}
