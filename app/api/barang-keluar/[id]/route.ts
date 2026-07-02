import {
  ApiError,
  jsonOk,
  parseIdParam,
  parseJson,
  parseTanggalKeluar,
  requireUser,
  route,
} from "@/lib/api";
import {
  deleteBarangKeluar,
  getBarangKeluarById,
  updateBarangKeluar,
} from "@/lib/barang-keluar";
import { revalidateMerchandiseListCache } from "@/lib/merchandise";
import { revalidateAnalyticsPages } from "@/lib/revalidate-analytics";
import { barangKeluarSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

type Ctx = { params: Promise<{ id: string }> };

function refreshTransaksiPages() {
  revalidatePath("/barang-keluar");
  revalidatePath("/riwayat-transaksi");
  revalidateMerchandiseListCache();
  revalidateAnalyticsPages();
}

// GET /api/barang-keluar/:id
export const GET = route<Ctx>(async (req, ctx) => {
  requireUser(req);
  const id = await parseIdParam(ctx);
  const data = await getBarangKeluarById(id);
  if (!data) throw new ApiError("Transaksi tidak ditemukan", 404);
  return jsonOk(data);
});

// PUT /api/barang-keluar/:id — stok lama dikembalikan lalu dipotong ulang otomatis
export const PUT = route<Ctx>(async (req, ctx) => {
  requireUser(req);
  const id = await parseIdParam(ctx);
  const data = await parseJson(req, barangKeluarSchema);

  if (!data.tanggal_keluar?.trim()) {
    throw new ApiError("tanggal_keluar wajib diisi saat update", 400);
  }

  const updated = await updateBarangKeluar(id, {
    id_merch: data.id_merch,
    id_stasiun: data.id_stasiun,
    id_kategori: data.id_kategori,
    jumlah: data.jumlah,
    tanggal_keluar: parseTanggalKeluar(data.tanggal_keluar),
    keterangan: data.keterangan || undefined,
  });

  refreshTransaksiPages();
  return jsonOk(updated);
});

// DELETE /api/barang-keluar/:id — stok otomatis dikembalikan
export const DELETE = route<Ctx>(async (req, ctx) => {
  requireUser(req);
  const id = await parseIdParam(ctx);
  await deleteBarangKeluar(id);
  refreshTransaksiPages();
  return jsonOk({ message: "Transaksi berhasil dihapus" });
});
