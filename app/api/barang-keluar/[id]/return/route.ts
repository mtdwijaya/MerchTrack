import { createBarangKembali } from "@/lib/barang-kembali";
import { getBarangKeluarById } from "@/lib/barang-keluar";
import {
  ApiError,
  jsonOk,
  parseIdParam,
  parseJson,
  parseTanggalKeluar,
  requireUser,
  route,
} from "@/lib/api";
import { revalidateMerchandiseListCache } from "@/lib/merchandise";
import { revalidateAnalyticsPages } from "@/lib/revalidate-analytics";
import { barangKembaliSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

type Ctx = { params: Promise<{ id: string }> };

function refreshTransaksiPages() {
  revalidatePath("/barang-keluar");
  revalidatePath("/laporan");
  revalidatePath("/riwayat-transaksi");
  revalidateMerchandiseListCache();
  revalidateAnalyticsPages();
}

// POST /api/barang-keluar/:id/return
export const POST = route<Ctx>(async (req, ctx) => {
  const user = requireUser(req);
  const id = await parseIdParam(ctx);
  const data = await parseJson(req, barangKembaliSchema);

  const transaksi = await getBarangKeluarById(id);
  if (!transaksi) throw new ApiError("Transaksi tidak ditemukan", 404);

  const tanggalKembali = parseTanggalKeluar(data.tanggal_kembali);

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
