export function buildBarangKeluarFormData(
  data: {
    id_tujuan: number;
    id_stasiun?: number;
    id_unit?: number;
    detail_teks?: string;
    tanggal_keluar: string;
    keterangan: string;
    items: { id_merch: number; jumlah: number }[];
  },
  bukti?: File | null
) {
  const formData = new FormData();
  formData.append("id_tujuan", String(data.id_tujuan));
  if (data.id_stasiun) formData.append("id_stasiun", String(data.id_stasiun));
  if (data.id_unit) formData.append("id_unit", String(data.id_unit));
  if (data.detail_teks) formData.append("detail_teks", data.detail_teks);
  formData.append("tanggal_keluar", data.tanggal_keluar);
  formData.append("keterangan", data.keterangan);
  formData.append("items", JSON.stringify(data.items));
  if (bukti) formData.append("bukti", bukti);
  return formData;
}

export function buildBarangKeluarEditFormData(
  data: {
    id_merch: number;
    id_tujuan: number;
    id_stasiun?: number;
    id_unit?: number;
    detail_teks?: string;
    jumlah: number;
    tanggal_keluar: string;
    keterangan: string;
  },
  bukti?: File | null
) {
  const formData = new FormData();
  formData.append("id_merch", String(data.id_merch));
  formData.append("id_tujuan", String(data.id_tujuan));
  if (data.id_stasiun) formData.append("id_stasiun", String(data.id_stasiun));
  if (data.id_unit) formData.append("id_unit", String(data.id_unit));
  if (data.detail_teks) formData.append("detail_teks", data.detail_teks);
  formData.append("jumlah", String(data.jumlah));
  formData.append("tanggal_keluar", data.tanggal_keluar);
  formData.append("keterangan", data.keterangan);
  if (bukti) formData.append("bukti", bukti);
  return formData;
}

export function buildRestockFormData(
  data: { jumlah: number; keterangan: string },
  bukti?: File | null
) {
  const formData = new FormData();
  formData.append("jumlah", String(data.jumlah));
  formData.append("keterangan", data.keterangan);
  if (bukti) formData.append("bukti", bukti);
  return formData;
}
