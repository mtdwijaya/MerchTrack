"use server";

import { revalidatePath } from "next/cache";

import { requireActionAdmin } from "@/lib/auth";
import {
  createPengguna,
  deletePengguna,
  getPenggunaById,
  updatePengguna,
} from "@/lib/pengguna";
import {
  idParamSchema,
  parseSchema,
  penggunaCreateSchema,
  penggunaUpdateSchema,
} from "@/lib/validations";

type ActionResult =
  | { ok: true }
  | { ok: false; message: string };

export async function getPenggunaFormData(id: number) {
  const auth = await requireActionAdmin();
  if (!auth.ok) return null;

  const idParsed = parseSchema(idParamSchema, id);
  if (!idParsed.ok) return null;

  const data = await getPenggunaById(idParsed.data);
  if (!data) return null;

  return {
    nama_user: data.nama_user,
    email: data.email,
    role: data.role as "ADMIN" | "PETUGAS",
    id_stasiun: data.stasiun?.id_stasiun ?? null,
  };
}

export async function createPenggunaAction(data: {
  nama_user: string;
  email: string;
  password: string;
  role: "ADMIN" | "PETUGAS";
  id_stasiun?: number | null;
}): Promise<ActionResult> {
  try {
    const auth = await requireActionAdmin();
    if (!auth.ok) return auth;

    const parsed = parseSchema(penggunaCreateSchema, data);
    if (!parsed.ok) return parsed;

    await createPengguna({
      ...parsed.data,
      id_stasiun: parsed.data.id_stasiun ?? undefined,
    });
    revalidatePath("/pengguna");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan",
    };
  }
}

export async function updatePenggunaAction(
  id: number,
  data: {
    nama_user: string;
    email: string;
    password: string;
    role: "ADMIN" | "PETUGAS";
    id_stasiun?: number | null;
  }
): Promise<ActionResult> {
  try {
    const auth = await requireActionAdmin();
    if (!auth.ok) return auth;

    const idParsed = parseSchema(idParamSchema, id);
    if (!idParsed.ok) return idParsed;

    const parsed = parseSchema(penggunaUpdateSchema, data);
    if (!parsed.ok) return parsed;

    const { password, ...rest } = parsed.data;

    await updatePengguna(idParsed.data, {
      ...rest,
      id_stasiun: rest.id_stasiun ?? undefined,
      ...(password?.trim() ? { password } : {}),
    });
    revalidatePath("/pengguna");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan",
    };
  }
}

export async function deletePenggunaAction(id: number): Promise<ActionResult> {
  try {
    const auth = await requireActionAdmin();
    if (!auth.ok) return auth;

    const idParsed = parseSchema(idParamSchema, id);
    if (!idParsed.ok) return idParsed;

    await deletePengguna(idParsed.data);
    revalidatePath("/pengguna");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Gagal menghapus pengguna",
    };
  }
}
