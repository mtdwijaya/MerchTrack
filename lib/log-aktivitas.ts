import { insertEditAktivitasLog } from "@/lib/aktivitas-log-db";

export async function logEditAktivitas(data: {
  id_keluar: number;
  id_user: number;
  pesan: string;
  occurredAt?: Date;
}) {
  void data.id_keluar;
  await insertEditAktivitasLog({
    id_user: data.id_user,
    pesan: data.pesan,
    occurredAt: data.occurredAt ?? new Date(),
  });
}
