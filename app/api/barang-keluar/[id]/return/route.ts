import {
  createBarangKembali,
  createBarangKembaliBatch,
} from "@/lib/barang-kembali";
import { canMutateBarangKeluar } from "@/lib/barang-keluar-access";
import { getBarangKeluarById, getBarangKeluarByGrup } from "@/lib/barang-keluar";
import {
  ApiError,
  jsonOk,
  parseIdParam,
  parseJson,
  parseTanggalKeluar,
  requireActiveUser,
  route,
} from "@/lib/api";
import { revalidateMerchandiseListCache } from "@/lib/merchandise";
import { revalidateAnalyticsPages } from "@/lib/revalidate-analytics";
import {
  barangKembaliBatchSchema,
  barangKembaliSchema,
} from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

function refreshTransaksiPages() {
  revalidatePath("/barang-keluar");
  revalidatePath("/monitoring");
  revalidatePath("/riwayat-transaksi");
  revalidateMerchandiseListCache();
  revalidateAnalyticsPages();
}

const returnBodySchema = z.union([
  barangKembaliBatchSchema,
  barangKembaliSchema,
]);

// POST /api/barang-keluar/:id/return
// Body single: { jumlah_kembali, ... } — item anchor
// Body batch: { items:[{id_keluar,jumlah_kembali}], ... } — multi-merch grup
export const POST = route<Ctx>(async (req, ctx) => {
  const user = await requireActiveUser(req);
  const id = await parseIdParam(ctx);
  const data = await parseJson(req, returnBodySchema);

  const transaksi = await getBarangKeluarById(id);
  if (!transaksi) throw new ApiError("Transaksi tidak ditemukan", 404);
  if (!canMutateBarangKeluar(user, transaksi)) {
    throw new ApiError("Anda tidak berhak mengubah transaksi ini", 403);
  }

  const tanggalKembali = parseTanggalKeluar(
    "items" in data ? data.tanggal_kembali : data.tanggal_kembali
  );

  if ("items" in data) {
    const groupIds = new Set(
      (
        transaksi.id_grup
          ? await getBarangKeluarByGrup(transaksi.id_grup)
          : [transaksi]
      ).map((row) => row.id_keluar)
    );

    for (const item of data.items) {
      if (item.jumlah_kembali <= 0) continue;
      if (!groupIds.has(item.id_keluar)) {
        throw new ApiError(
          `Item ${item.id_keluar} bukan bagian dari transaksi ini`,
          400
        );
      }
      const row = await getBarangKeluarById(item.id_keluar);
      if (!row) throw new ApiError("Item transaksi tidak ditemukan", 404);
      if (!canMutateBarangKeluar(user, row)) {
        throw new ApiError("Anda tidak berhak mengubah transaksi ini", 403);
      }
    }

    const created = await createBarangKembaliBatch(
      user.id_user,
      {
        tanggal_kembali: tanggalKembali,
        pengembali: data.pengembali,
        asal: data.asal,
        keterangan: data.keterangan || undefined,
      },
      data.items
    );

    refreshTransaksiPages();
    return jsonOk(created, 201);
  }

  const created = await createBarangKembali({
    id_keluar: id,
    id_user: user.id_user,
    jumlah_kembali: data.jumlah_kembali,
    tanggal_kembali: tanggalKembali,
    pengembali: data.pengembali,
    asal: data.asal,
    keterangan: data.keterangan || undefined,
  });

  refreshTransaksiPages();
  return jsonOk(created, 201);
});
