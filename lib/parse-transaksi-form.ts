import { parseFormDateWithNowTime } from "@/lib/relative-time";
import { saveBuktiFromFormData } from "@/lib/upload-bukti";
import {
  barangKeluarBatchSchema,
  barangKeluarSchema,
  merchandiseRestockSchema,
  parseSchema,
} from "@/lib/validations";

export function parseBarangKeluarFormData(formData: FormData) {
  const rawItems = formData.get("items");

  if (typeof rawItems === "string" && rawItems.trim()) {
    let items: unknown;
    try {
      items = JSON.parse(rawItems);
    } catch {
      return { ok: false as const, message: "Format item merchandise tidak valid" };
    }

    const raw = {
      nama_petugas: formData.get("nama_petugas"),
      id_tujuan: formData.get("id_tujuan"),
      id_stasiun: formData.get("id_stasiun") || undefined,
      id_unit: formData.get("id_unit") || undefined,
      detail_teks: formData.get("detail_teks") || undefined,
      tanggal_keluar: formData.get("tanggal_keluar") || undefined,
      keterangan: formData.get("keterangan") || undefined,
      items,
    };

    return parseSchema(barangKeluarBatchSchema, raw);
  }

  const raw = {
    nama_petugas: formData.get("nama_petugas"),
    id_merch: formData.get("id_merch"),
    id_tujuan: formData.get("id_tujuan"),
    id_stasiun: formData.get("id_stasiun") || undefined,
    id_unit: formData.get("id_unit") || undefined,
    detail_teks: formData.get("detail_teks") || undefined,
    jumlah: formData.get("jumlah"),
    tanggal_keluar: formData.get("tanggal_keluar") || undefined,
    keterangan: formData.get("keterangan") || undefined,
  };

  return parseSchema(barangKeluarSchema, raw);
}

export async function parseBarangKeluarBukti(formData: FormData) {
  return saveBuktiFromFormData(formData, "keluar");
}

export function parseRestockFormData(formData: FormData) {
  const raw = {
    nama_petugas: formData.get("nama_petugas"),
    jumlah: formData.get("jumlah"),
    keterangan: formData.get("keterangan") || undefined,
  };
  return parseSchema(merchandiseRestockSchema, raw);
}

export async function parseRestockBukti(formData: FormData) {
  return saveBuktiFromFormData(formData, "masuk");
}

export function getTanggalFromForm(value?: string) {
  return value ? parseFormDateWithNowTime(value) : undefined;
}

export function isBarangKeluarBatchData(
  data: unknown
): data is {
  nama_petugas: string;
  id_tujuan: number;
  id_stasiun?: number;
  id_unit?: number;
  detail_teks?: string;
  tanggal_keluar?: string;
  keterangan?: string;
  items: { id_keluar?: number; id_merch: number; jumlah: number }[];
} {
  return (
    typeof data === "object" &&
    data !== null &&
    "items" in data &&
    Array.isArray((data as { items: unknown }).items)
  );
}

export function isBarangKeluarEditBatchData(
  data: unknown
): data is {
  nama_petugas: string;
  id_tujuan: number;
  id_stasiun?: number;
  id_unit?: number;
  detail_teks?: string;
  tanggal_keluar?: string;
  keterangan?: string;
  items: { id_keluar: number; id_merch: number; jumlah: number }[];
} {
  if (!isBarangKeluarBatchData(data) || data.items.length < 2) {
    return false;
  }

  return data.items.every(
    (item) => typeof item.id_keluar === "number" && item.id_keluar > 0
  );
}
