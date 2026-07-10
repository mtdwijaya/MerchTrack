import {
  getQuery,
  jsonError,
  jsonOk,
  parseTanggalKeluar,
  requireUser,
  route,
} from "@/lib/api";
import {
  createBarangKeluar,
  createBarangKeluarBatch,
  getBarangKeluarPaginated,
  getBarangKeluarSummary,
  parseBarangKeluarSort,
} from "@/lib/barang-keluar";
import { revalidateMerchandiseListCache } from "@/lib/merchandise";
import { revalidateAnalyticsPages } from "@/lib/revalidate-analytics";
import { parseSortValue } from "@/lib/sort";
import { barangKeluarBatchSchema, barangKeluarSchema, parseSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

// GET /api/barang-keluar?page=&limit=&search=&sort=tanggal_keluar:desc&id_tujuan=
export const GET = route(async (req) => {
  requireUser(req);
  const q = getQuery(req);
  const { sortBy, sortOrder } = parseSortValue(
    q.str("sort", "tanggal_keluar:desc"),
    "tanggal_keluar",
    "desc"
  );
  const parsed = parseBarangKeluarSort(sortBy, sortOrder);

  const [list, summary] = await Promise.all([
    getBarangKeluarPaginated({
      page: q.num("page", 1),
      limit: q.num("limit", 10),
      search: q.str("search") || undefined,
      sortBy: parsed.sortBy,
      sortOrder: parsed.sortOrder,
      idTujuan: q.optionalNum("id_tujuan"),
    }),
    getBarangKeluarSummary(),
  ]);

  return jsonOk({ ...list, summary });
});

// POST /api/barang-keluar
export const POST = route(async (req) => {
  const user = requireUser(req);
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
    const parsed = parseSchema(barangKeluarBatchSchema, body);
    if (!parsed.ok) return jsonError(parsed.message, 400);

    const created = await createBarangKeluarBatch({
      id_tujuan: parsed.data.id_tujuan,
      id_stasiun: parsed.data.id_stasiun,
      id_unit: parsed.data.id_unit,
      detail_teks: parsed.data.detail_teks,
      id_user: user.id_user,
      items: parsed.data.items,
      tanggal_keluar: parseTanggalKeluar(parsed.data.tanggal_keluar),
      keterangan: parsed.data.keterangan || undefined,
    });

    revalidatePath("/barang-keluar");
    revalidatePath("/laporan");
    revalidatePath("/riwayat-transaksi");
    revalidateMerchandiseListCache();
    revalidateAnalyticsPages();
    return jsonOk(created, 201);
  }

  const parsedSingle = parseSchema(barangKeluarSchema, body);
  if (!parsedSingle.ok) return jsonError(parsedSingle.message, 400);

  const created = await createBarangKeluar({
    id_merch: parsedSingle.data.id_merch,
    id_tujuan: parsedSingle.data.id_tujuan,
    id_stasiun: parsedSingle.data.id_stasiun,
    id_unit: parsedSingle.data.id_unit,
    detail_teks: parsedSingle.data.detail_teks,
    id_user: user.id_user,
    jumlah: parsedSingle.data.jumlah,
    tanggal_keluar: parseTanggalKeluar(parsedSingle.data.tanggal_keluar),
    keterangan: parsedSingle.data.keterangan || undefined,
  });

  revalidatePath("/barang-keluar");
  revalidatePath("/laporan");
  revalidatePath("/riwayat-transaksi");
  revalidateMerchandiseListCache();
  revalidateAnalyticsPages();
  return jsonOk(created, 201);
});
