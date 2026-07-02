import {
  getQuery,
  jsonOk,
  parseJson,
  parseTanggalKeluar,
  requireUser,
  route,
} from "@/lib/api";
import {
  createBarangKeluar,
  getBarangKeluarPaginated,
  getBarangKeluarSummary,
  parseBarangKeluarSort,
} from "@/lib/barang-keluar";
import { revalidateMerchandiseListCache } from "@/lib/merchandise";
import { revalidateAnalyticsPages } from "@/lib/revalidate-analytics";
import { parseSortValue } from "@/lib/sort";
import { barangKeluarSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

// GET /api/barang-keluar?page=&limit=&search=&sort=tanggal_keluar:desc&id_stasiun=&id_kategori=
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
      idStasiun: q.optionalNum("id_stasiun"),
      idKategori: q.optionalNum("id_kategori"),
    }),
    getBarangKeluarSummary(),
  ]);

  return jsonOk({ ...list, summary });
});

// POST /api/barang-keluar — catat barang keluar (user login mana pun)
export const POST = route(async (req) => {
  const user = requireUser(req);
  const data = await parseJson(req, barangKeluarSchema);

  const created = await createBarangKeluar({
    id_merch: data.id_merch,
    id_stasiun: data.id_stasiun,
    id_kategori: data.id_kategori,
    id_user: user.id_user,
    jumlah: data.jumlah,
    tanggal_keluar: parseTanggalKeluar(data.tanggal_keluar),
    keterangan: data.keterangan || undefined,
  });

  revalidatePath("/barang-keluar");
  revalidatePath("/riwayat-transaksi");
  revalidateMerchandiseListCache();
  revalidateAnalyticsPages();
  return jsonOk(created, 201);
});
