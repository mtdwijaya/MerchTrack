import { prisma } from "@/lib/prisma";
import { formatTransaksiId } from "@/lib/format-transaksi";

export type AktivitasLogRow = {
  id_aktivitas: number;
  jenis: "EDIT";
  pesan: string;
  created_at: Date;
};

export type AktivitasLogClient = {
  findMany(args: {
    take?: number;
    where?: { jenis?: "EDIT" };
    orderBy: { created_at: "desc" } | { id_aktivitas: "desc" };
    select: {
      id_aktivitas: true;
      jenis: true;
      pesan: true;
      created_at: true;
    };
  }): Promise<AktivitasLogRow[]>;
  create(args: {
    data: {
      jenis: "EDIT";
      id_user: number;
      pesan: string;
      created_at?: Date;
    };
  }): Promise<unknown>;
};

function getAktivitasLogClient(): AktivitasLogClient {
  const client = prisma as typeof prisma & { aktivitasLog?: AktivitasLogClient };

  if (client.aktivitasLog) {
    return client.aktivitasLog;
  }

  throw new Error(
    "Model AktivitasLog belum tersedia di Prisma client. Hentikan dev server lalu jalankan: npx prisma generate"
  );
}

export async function fetchRecentEditLogs(
  limit = 10
): Promise<AktivitasLogRow[]> {
  return getAktivitasLogClient().findMany({
    take: limit,
    where: { jenis: "EDIT" },
    orderBy: { created_at: "desc" },
    select: {
      id_aktivitas: true,
      jenis: true,
      pesan: true,
      created_at: true,
    },
  });
}

export async function fetchAllEditLogs(): Promise<AktivitasLogRow[]> {
  return getAktivitasLogClient().findMany({
    where: { jenis: "EDIT" },
    orderBy: { created_at: "desc" },
    select: {
      id_aktivitas: true,
      jenis: true,
      pesan: true,
      created_at: true,
    },
  });
}

/** Selalu buat log edit baru — tidak update log lama */
export async function insertEditAktivitasLog(data: {
  id_user: number;
  pesan: string;
  occurredAt: Date;
}) {
  await getAktivitasLogClient().create({
    data: {
      jenis: "EDIT",
      id_user: data.id_user,
      pesan: data.pesan,
      created_at: data.occurredAt,
    },
  });
}

type AktivitasLogDeleter = {
  aktivitasLog: {
    deleteMany(args: {
      where: { pesan: { contains: string } };
    }): Promise<{ count: number }>;
  };
};

export async function deleteEditLogsForTransaksi(
  id_keluar: number,
  client: AktivitasLogDeleter = prisma
) {
  const trxRef = formatTransaksiId(id_keluar);
  await client.aktivitasLog.deleteMany({
    where: { pesan: { contains: trxRef } },
  });
}
