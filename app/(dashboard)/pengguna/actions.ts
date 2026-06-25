"use server";

import { revalidatePath } from "next/cache";

import {
  createPengguna,
  deletePengguna,
  getPenggunaById,
  updatePengguna,
} from "@/lib/pengguna";

type ActionResult =
  | { ok: true }
  | { ok: false; message: string };

export async function getPenggunaFormData(id: number) {
  const data = await getPenggunaById(id);
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
    await createPengguna({
      ...data,
      id_stasiun: data.id_stasiun ?? undefined,
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
    await updatePengguna(id, {
      ...data,
      id_stasiun: data.id_stasiun ?? undefined,
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
    await deletePengguna(id);
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