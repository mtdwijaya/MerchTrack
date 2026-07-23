"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { clearAuthCookie, requireActionUser } from "@/lib/auth";
import { createBarangKeluarBatch } from "@/lib/barang-keluar";
import {
  restockMerchandise,
  revalidateMerchandiseListCache,
} from "@/lib/merchandise";
import { revalidateAnalyticsPages } from "@/lib/revalidate-analytics";
import { parseSchema } from "@/lib/validations";
import { z } from "zod";

type ActionResult = { ok: true } | { ok: false; message: string };

const cartItemSchema = z.object({
  id_merch: z.coerce.number().int().positive(),
  jumlah: z.coerce.number().int().positive("Jumlah minimal 1"),
});

const outSchema = z.object({
  nama_petugas: z.string().trim().min(1, "Nama petugas wajib dipilih"),
  id_tujuan: z.coerce.number().int().positive("Tujuan wajib dipilih"),
  id_stasiun: z.coerce.number().int().positive().optional().nullable(),
  id_unit: z.coerce.number().int().positive().optional().nullable(),
  detail_teks: z.string().optional().nullable(),
  items: z.array(cartItemSchema).min(1, "Pilih minimal 1 merchandise"),
});

const returnSchema = z.object({
  nama_petugas: z.string().trim().min(1, "Nama petugas wajib dipilih"),
  items: z.array(cartItemSchema).min(1, "Pilih minimal 1 merchandise"),
});

export async function logoutTabletAction() {
  await clearAuthCookie();
  redirect("/login");
}

export async function confirmQuickOutAction(input: unknown): Promise<ActionResult> {
  const auth = await requireActionUser();
  if (!auth.ok) return { ok: false, message: auth.message };

  const parsed = parseSchema(outSchema, input);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  try {
    await createBarangKeluarBatch({
      id_user: auth.user.id_user,
      nama_petugas: parsed.data.nama_petugas,
      id_tujuan: parsed.data.id_tujuan,
      id_stasiun: parsed.data.id_stasiun ?? undefined,
      id_unit: parsed.data.id_unit ?? undefined,
      detail_teks: parsed.data.detail_teks ?? undefined,
      items: parsed.data.items,
      tanggal_keluar: new Date(),
    });

    revalidateMerchandiseListCache();
    revalidateAnalyticsPages();
    revalidatePath("/");
    revalidatePath("/admin/barang-keluar");
    revalidatePath("/admin/riwayat-transaksi");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Gagal menyimpan barang keluar",
    };
  }
}

export async function confirmQuickReturnAction(
  input: unknown
): Promise<ActionResult> {
  const auth = await requireActionUser();
  if (!auth.ok) return { ok: false, message: auth.message };

  const parsed = parseSchema(returnSchema, input);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  try {
    for (const item of parsed.data.items) {
      await restockMerchandise(item.id_merch, auth.user.id_user, {
        nama_petugas: parsed.data.nama_petugas,
        jumlah: item.jumlah,
        keterangan: "Pengembalian via akses cepat",
      });
    }

    revalidateMerchandiseListCache();
    revalidateAnalyticsPages();
    revalidatePath("/");
    revalidatePath("/admin/monitoring");
    revalidatePath("/admin/riwayat-transaksi");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal menyimpan pengembalian stok",
    };
  }
}
