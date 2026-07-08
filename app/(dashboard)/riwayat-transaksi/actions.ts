"use server";

import { requireActionUser } from "@/lib/auth";
import { getBarangMasukDetail } from "@/lib/barang-masuk";
import { idParamSchema, parseSchema } from "@/lib/validations";

export async function getBarangMasukDetailAction(id: number) {
  const auth = await requireActionUser();
  if (!auth.ok) return null;

  const idParsed = parseSchema(idParamSchema, id);
  if (!idParsed.ok) return null;

  return getBarangMasukDetail(idParsed.data);
}
