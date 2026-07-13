import {
  getBarangKembaliByKeluarIds,
  reconcileMissingBarangKembaliRecords,
} from "@/lib/barang-kembali";
import { asBarangKembaliWithMetaList } from "@/lib/barang-kembali-types";
import {
  getBarangKeluarByGrup,
  getBarangKeluarById,
} from "@/lib/barang-keluar";
import { aggregateGrupStatus } from "@/lib/barang-keluar-group";
import { getBarangKeluarQuantities } from "@/lib/barang-keluar-quantities";
import type { BarangKeluarWithRelations } from "@/lib/barang-keluar-types";
import { formatDetailTujuan } from "@/lib/detail-tujuan";

/** Payload detail transaksi — dipakai UI actions & REST API. */
export async function getBarangKeluarDetailPayload(id: number) {
  const data = await getBarangKeluarById(id);
  if (!data) return null;

  const allItems: BarangKeluarWithRelations[] = data.id_grup
    ? await getBarangKeluarByGrup(data.id_grup)
    : [data];

  await reconcileMissingBarangKembaliRecords(data.id_keluar);
  const riwayatKembali = asBarangKembaliWithMetaList(
    await getBarangKembaliByKeluarIds(allItems.map((item) => item.id_keluar))
  );
  const qty = getBarangKeluarQuantities(data.jumlah, data.jumlah_kembali);

  const grupItems = allItems.map((item) => ({
    id_keluar: item.id_keluar,
    merchandise: item.merchandise.nama_merch,
    qty: getBarangKeluarQuantities(item.jumlah, item.jumlah_kembali),
    status: item.status,
    sisa_return: item.jumlah,
  }));

  const isMulti = grupItems.length > 1;

  return {
    id_keluar: data.id_keluar,
    id_grup: data.id_grup,
    is_multi: isMulti,
    tanggal_keluar: data.tanggal_keluar.toISOString(),
    keterangan: data.keterangan,
    status: isMulti
      ? aggregateGrupStatus(grupItems.map((item) => item.status))
      : data.status,
    merchandise: data.merchandise.nama_merch,
    tujuan: data.tujuan.nama_tujuan,
    detail_tujuan: formatDetailTujuan(data),
    petugas: data.user.nama_user,
    bukti_path: data.bukti_path,
    bukti_nama: data.bukti_nama,
    qty,
    sisa_return: data.jumlah,
    grup_items: grupItems,
    items: allItems.map((item) => ({
      id_keluar: item.id_keluar,
      id_merch: item.id_merch,
      jumlah: item.jumlah,
      jumlah_kembali: item.jumlah_kembali,
      status: item.status,
      merchandise: item.merchandise.nama_merch,
    })),
    riwayat_kembali: riwayatKembali.map((item) => ({
      id_kembali: item.id_kembali,
      jumlah_kembali: item.jumlah_kembali,
      tanggal_kembali: item.tanggal_kembali.toISOString(),
      merchandise:
        item.barangKeluar?.merchandise.nama_merch ?? data.merchandise.nama_merch,
      pengembali: item.pengembali,
      asal: item.asal,
      keterangan: item.keterangan,
      petugas: item.user.nama_user,
    })),
  };
}
