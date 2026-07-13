import type { CurrentUser } from "@/lib/auth";

type Actor = Pick<CurrentUser, "id_user" | "role">;

/** Admin boleh semua; petugas hanya transaksi miliknya. */
export function canMutateBarangKeluar(
  actor: Actor,
  transaksi: { id_user: number }
) {
  if (actor.role === "ADMIN") return true;
  return transaksi.id_user === actor.id_user;
}

export function assertCanMutateBarangKeluar(
  actor: Actor,
  transaksi: { id_user: number }
) {
  if (!canMutateBarangKeluar(actor, transaksi)) {
    throw new Error("Anda tidak berhak mengubah transaksi ini");
  }
}
