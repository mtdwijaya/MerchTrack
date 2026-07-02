import {
  jsonOk,
  parseIdParam,
  parseJson,
  requireAdmin,
  route,
} from "@/lib/api";
import {
  restockMerchandise,
  revalidateMerchandiseListCache,
} from "@/lib/merchandise";
import { revalidateAnalyticsPages } from "@/lib/revalidate-analytics";
import { merchandiseRestockSchema } from "@/lib/validations";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/merchandise/:id/restock — tambah stok + catat barang masuk (ADMIN)
export const POST = route<Ctx>(async (req, ctx) => {
  const admin = await requireAdmin(req);
  const id = await parseIdParam(ctx);
  const data = await parseJson(req, merchandiseRestockSchema);

  const result = await restockMerchandise(id, admin.id_user, {
    jumlah: data.jumlah,
    keterangan: data.keterangan || undefined,
  });

  revalidateMerchandiseListCache();
  revalidateAnalyticsPages();
  return jsonOk(result);
});
