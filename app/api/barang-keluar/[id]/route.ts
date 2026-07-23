import {
  ApiError,
  jsonError,
  jsonOk,
  parseIdParam,
  parseTanggalKeluar,
  requireActiveUser,
  requireUser,
  route,
} from "@/lib/api";
import { canMutateBarangKeluar } from "@/lib/barang-keluar-access";
import {
  deleteBarangKeluar,
  getBarangKeluarById,
  updateBarangKeluar,
  updateBarangKeluarBatch,
} from "@/lib/barang-keluar";
import { getBarangKeluarDetailPayload } from "@/lib/barang-keluar-detail";
import { revalidateMerchandiseListCache } from "@/lib/merchandise";
import { revalidateAnalyticsPages } from "@/lib/revalidate-analytics";
import {
  barangKeluarEditBatchSchema,
  barangKeluarSchema,
  parseSchema,
} from "@/lib/validations";
import { revalidatePath } from "next/cache";

type Ctx = { params: Promise<{ id: string }> };

function refreshTransaksiPages() {
  revalidatePath("/admin/barang-keluar");
  revalidatePath("/admin/laporan");
  revalidatePath("/admin/riwayat-transaksi");
  revalidateMerchandiseListCache();
  revalidateAnalyticsPages();
}

// GET /api/barang-keluar/:id — detail grup (sama shape dengan UI)
export const GET = route<Ctx>(async (req, ctx) => {
  requireUser(req);
  const id = await parseIdParam(ctx);
  const data = await getBarangKeluarDetailPayload(id);
  if (!data) throw new ApiError("Transaksi tidak ditemukan", 404);
  return jsonOk(data);
});

// PUT /api/barang-keluar/:id — single atau batch edit (body punya "items" + id_keluar)
export const PUT = route<Ctx>(async (req, ctx) => {
  const user = await requireActiveUser(req);
  const id = await parseIdParam(ctx);

  const existing = await getBarangKeluarById(id);
  if (!existing) throw new ApiError("Transaksi tidak ditemukan", 404);
  if (!canMutateBarangKeluar(user, existing)) {
    throw new ApiError("Anda tidak berhak mengubah transaksi ini", 403);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Body harus berupa JSON yang valid", 400);
  }

  if (
    typeof body === "object" &&
    body !== null &&
    "items" in body &&
    Array.isArray((body as { items: unknown }).items)
  ) {
    const parsed = parseSchema(barangKeluarEditBatchSchema, body);
    if (!parsed.ok) return jsonError(parsed.message, 400);

    if (!parsed.data.tanggal_keluar?.trim()) {
      throw new ApiError("tanggal_keluar wajib diisi saat update", 400);
    }

    await updateBarangKeluarBatch(id, {
      nama_petugas: parsed.data.nama_petugas,
      id_tujuan: parsed.data.id_tujuan,
      id_stasiun: parsed.data.id_stasiun,
      id_unit: parsed.data.id_unit,
      detail_teks: parsed.data.detail_teks,
      tanggal_keluar: parseTanggalKeluar(parsed.data.tanggal_keluar),
      keterangan: parsed.data.keterangan || undefined,
      items: parsed.data.items,
    });

    refreshTransaksiPages();
    const detail = await getBarangKeluarDetailPayload(id);
    return jsonOk(detail);
  }

  const data = parseSchema(barangKeluarSchema, body);
  if (!data.ok) return jsonError(data.message, 400);

  if (!data.data.tanggal_keluar?.trim()) {
    throw new ApiError("tanggal_keluar wajib diisi saat update", 400);
  }

  const updated = await updateBarangKeluar(id, {
    nama_petugas: data.data.nama_petugas,
    id_merch: data.data.id_merch,
    id_tujuan: data.data.id_tujuan,
    id_stasiun: data.data.id_stasiun,
    id_unit: data.data.id_unit,
    detail_teks: data.data.detail_teks,
    jumlah: data.data.jumlah,
    tanggal_keluar: parseTanggalKeluar(data.data.tanggal_keluar),
    keterangan: data.data.keterangan || undefined,
  });

  refreshTransaksiPages();
  return jsonOk(updated);
});

// DELETE /api/barang-keluar/:id — hapus 1 baris / seluruh grup (logika di lib)
export const DELETE = route<Ctx>(async (req, ctx) => {
  const user = await requireActiveUser(req);
  const id = await parseIdParam(ctx);

  const existing = await getBarangKeluarById(id);
  if (!existing) throw new ApiError("Transaksi tidak ditemukan", 404);
  if (!canMutateBarangKeluar(user, existing)) {
    throw new ApiError("Anda tidak berhak mengubah transaksi ini", 403);
  }

  await deleteBarangKeluar(id);
  refreshTransaksiPages();
  return jsonOk({ message: "Transaksi berhasil dihapus" });
});
