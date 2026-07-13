import type { Role } from "@prisma/client";

import {
  fetchRecentEditLogs,
  type AktivitasLogRow,
} from "@/lib/aktivitas-log-db";
import { formatDetailTujuan } from "@/lib/detail-tujuan";
import { parseEditActivityPesan } from "@/lib/edit-activity-summary";
import {
  formatTransaksiId,
  parseTransaksiNumber,
} from "@/lib/format-transaksi";
import {
  recentBarangKeluarInclude,
  recentBarangKembaliInclude,
  recentBarangMasukInclude,
} from "@/lib/prisma-selects";
import { prisma } from "@/lib/prisma";

export type ActivityAudience = "all" | "admin";

export type RecentActivityItem = {
  id: string;
  occurredAt: string;
  type: "Barang Keluar" | "Barang Dikembalikan" | "Edit Transaksi" | "Restock";
  tone: "urgent" | "processing" | "returned" | "verified" | "edit";
  audience: ActivityAudience;
  title: string;
  meta: string;
  detailId?: number;
};

const DASHBOARD_ACTIVITY_LIMIT = 5;
const ACTIVITY_SOURCE_LIMIT = 25;
/** Batas sumber untuk list aktivitas terpaginasi — hindari load seluruh tabel. */
const ACTIVITY_PAGE_SOURCE_LIMIT = 400;

type RecentKeluarRow = {
  id_keluar: number;
  jumlah: number;
  jumlah_kembali: number;
  tanggal_keluar: Date;
  dicatat_pada?: Date;
  detail_teks: string | null;
  merchandise: { nama_merch: string };
  stasiun: { nama_stasiun: string } | null;
  unit: { nama_unit: string } | null;
  tujuan: {
    nama_tujuan: string;
    jenis_detail: import("@prisma/client").JenisDetailTujuan;
  };
  user: { nama_user: string };
};

export type MonitoringUser = {
  id_user: number;
  id_stasiun: number | null;
  role: Role;
};

function toIso(date: Date | string) {
  return new Date(date).toISOString();
}

function compareActivity(a: RecentActivityItem, b: RecentActivityItem) {
  const timeDiff =
    new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime();
  if (timeDiff !== 0) return timeDiff;

  const idNum = (id: string) => Number(id.split("-").pop()) || 0;
  return idNum(b.id) - idNum(a.id);
}

function editOccurredAtMs(
  log: AktivitasLogRow,
  parsed: ReturnType<typeof parseEditActivityPesan>
) {
  const createdMs = new Date(log.created_at).getTime();

  if (parsed.occurredAt) {
    const stampedMs = new Date(parsed.occurredAt).getTime();
    // Pakai stamp hanya jika valid dan selaras dengan created_at di DB
    if (
      !Number.isNaN(stampedMs) &&
      Math.abs(stampedMs - createdMs) < 2 * 60 * 60 * 1000
    ) {
      return stampedMs;
    }
  }

  return createdMs;
}

function resolveEditOccurredAt(
  log: AktivitasLogRow,
  parsed: ReturnType<typeof parseEditActivityPesan>
) {
  return toIso(new Date(editOccurredAtMs(log, parsed)));
}

function shouldReplaceEditLog(
  current: { log: AktivitasLogRow; parsed: ReturnType<typeof parseEditActivityPesan> },
  candidate: { log: AktivitasLogRow; parsed: ReturnType<typeof parseEditActivityPesan> }
) {
  const currentHasStamp = !!current.parsed.occurredAt;
  const candidateHasStamp = !!candidate.parsed.occurredAt;

  if (candidateHasStamp && !currentHasStamp) return true;
  if (!candidateHasStamp && currentHasStamp) return false;

  const currentMs = editOccurredAtMs(current.log, current.parsed);
  const candidateMs = editOccurredAtMs(candidate.log, candidate.parsed);
  if (candidateMs !== currentMs) return candidateMs > currentMs;

  return candidate.log.id_aktivitas > current.log.id_aktivitas;
}

function buildEditActivitiesAll(recentLogs: AktivitasLogRow[]) {
  return recentLogs.map((log) => {
    const parsed = parseEditActivityPesan(log.pesan);
    const trxNum =
      parseTransaksiNumber(parsed.trx) ?? parseTransaksiNumber(log.pesan);

    return {
      id: `edit-${log.id_aktivitas}`,
      title: parsed.trx ? `${parsed.merch} · ${parsed.trx}` : parsed.merch,
      meta: `${parsed.actor} · ${parsed.changes}`,
      occurredAt: resolveEditOccurredAt(log, parsed),
      type: "Edit Transaksi" as const,
      tone: "edit" as const,
      audience: "all" as const,
      detailId: trxNum ?? undefined,
    };
  });
}

function buildEditActivities(recentLogs: AktivitasLogRow[]) {
  const latestByTrx = new Map<
    number,
    { log: AktivitasLogRow; parsed: ReturnType<typeof parseEditActivityPesan> }
  >();

  for (const item of recentLogs) {
    const parsed = parseEditActivityPesan(item.pesan);
    const trxNum =
      parseTransaksiNumber(parsed.trx) ??
      parseTransaksiNumber(item.pesan);

    if (!trxNum) continue;

    const candidate = { log: item, parsed };
    const existing = latestByTrx.get(trxNum);

    if (!existing || shouldReplaceEditLog(existing, candidate)) {
      latestByTrx.set(trxNum, candidate);
    }
  }

  return Array.from(latestByTrx.values()).map(({ log, parsed }) => ({
    id: `edit-${log.id_aktivitas}`,
    title: parsed.trx ? `${parsed.merch} · ${parsed.trx}` : parsed.merch,
    meta: `${parsed.actor} · ${parsed.changes}`,
    occurredAt: resolveEditOccurredAt(log, parsed),
    type: "Edit Transaksi" as const,
    tone: "edit" as const,
    audience: "all" as const,
    detailId:
      parseTransaksiNumber(parsed.trx) ??
      parseTransaksiNumber(log.pesan) ??
      undefined,
  }));
}

function buildRecentActivity(
  user: MonitoringUser,
  recentBarangKeluar: RecentKeluarRow[],
  recentBarangMasuk: {
    id_masuk: number;
    jumlah: number;
    tanggal_masuk: Date;
    merchandise: { nama_merch: string };
    user: { nama_user: string };
  }[],
  recentBarangKembali: {
    id_kembali: number;
    jumlah_kembali: number;
    tanggal_kembali: Date;
    pengembali?: string | null;
    asal?: string | null;
    user: { nama_user: string };
    barangKeluar: {
      id_keluar: number;
      merchandise: { nama_merch: string };
      tujuan: {
        nama_tujuan: string;
        jenis_detail: import("@prisma/client").JenisDetailTujuan;
      };
      stasiun: { nama_stasiun: string } | null;
      unit: { nama_unit: string } | null;
      detail_teks: string | null;
    };
  }[],
  recentLogs: AktivitasLogRow[],
  options?: { limit?: number; includeAllEditLogs?: boolean }
): RecentActivityItem[] {
  const totalKeluar = (item: { jumlah: number; jumlah_kembali: number }) =>
    item.jumlah + item.jumlah_kembali;

  const activityFromKeluar: RecentActivityItem[] = recentBarangKeluar.map(
    (item) => {
      const qty = totalKeluar(item);
      const detail = formatDetailTujuan(item);
      const occurredAt = item.dicatat_pada ?? item.tanggal_keluar;

      return {
        id: `bk-${item.id_keluar}`,
        title: `${qty.toLocaleString("id-ID")} pcs · ${item.merchandise.nama_merch}`,
        meta: `${item.user.nama_user} · ${item.tujuan.nama_tujuan}${detail !== item.tujuan.nama_tujuan ? ` · ${detail}` : ""}`,
        occurredAt: toIso(occurredAt),
        type: "Barang Keluar",
        tone: qty >= 50 ? "urgent" : "processing",
        audience: "all",
        detailId: item.id_keluar,
      };
    }
  );

  const activityFromKembali: RecentActivityItem[] = recentBarangKembali.map(
    (item) => ({
      id: `bkb-${item.id_kembali}`,
      title: `${item.jumlah_kembali.toLocaleString("id-ID")} pcs · ${item.barangKeluar.merchandise.nama_merch}`,
      meta: `${item.pengembali ?? item.user.nama_user}${item.asal ? ` · ${item.asal}` : ""} · ${formatTransaksiId(item.barangKeluar.id_keluar)}`,
      occurredAt: toIso(item.tanggal_kembali),
      type: "Barang Dikembalikan",
      tone: "returned",
      audience: "all",
      detailId: item.barangKeluar.id_keluar,
    })
  );

  const activityFromMasuk: RecentActivityItem[] =
    user.role === "ADMIN"
      ? recentBarangMasuk.map((item) => ({
          id: `bm-${item.id_masuk}`,
          title: `${item.jumlah.toLocaleString("id-ID")} pcs · ${item.merchandise.nama_merch}`,
          meta: item.user.nama_user,
          occurredAt: toIso(item.tanggal_masuk),
          type: "Restock",
          tone: "verified",
          audience: "admin",
        }))
      : [];

  const activityFromEdit = options?.includeAllEditLogs
    ? buildEditActivitiesAll(recentLogs)
    : buildEditActivities(recentLogs);

  const sorted = [
    ...activityFromKeluar,
    ...activityFromKembali,
    ...activityFromMasuk,
    ...activityFromEdit,
  ].sort(compareActivity);

  if (options?.limit) {
    return sorted.slice(0, options.limit);
  }

  return sorted;
}

// aktivitas terbaru tidak di-cache supaya waktu & urutan selalu fresh
async function fetchRecentBarangKeluar(limit: number): Promise<RecentKeluarRow[]> {
  const query = {
    take: limit,
    include: recentBarangKeluarInclude,
  };

  try {
    return prisma.barangKeluar.findMany({
      ...query,
      orderBy: { dicatat_pada: "desc" },
    }) as Promise<RecentKeluarRow[]>;
  } catch {
    return (await prisma.barangKeluar.findMany({
      ...query,
      orderBy: { tanggal_keluar: "desc" },
    })) as RecentKeluarRow[];
  }
}

async function fetchAllActivitySources(user: MonitoringUser) {
  const isAdmin = user.role === "ADMIN";

  const [recentBarangKeluar, recentBarangMasuk, recentBarangKembali, recentLogs] =
    await Promise.all([
      fetchRecentBarangKeluar(ACTIVITY_PAGE_SOURCE_LIMIT),
      isAdmin
        ? prisma.barangMasuk.findMany({
            take: ACTIVITY_PAGE_SOURCE_LIMIT,
            orderBy: { tanggal_masuk: "desc" },
            include: recentBarangMasukInclude,
          })
        : Promise.resolve([]),
      prisma.barangKembali.findMany({
        take: ACTIVITY_PAGE_SOURCE_LIMIT,
        orderBy: [{ tanggal_kembali: "desc" }, { id_kembali: "desc" }],
        include: recentBarangKembaliInclude,
      }),
      fetchRecentEditLogs(ACTIVITY_PAGE_SOURCE_LIMIT),
    ]);

  return buildRecentActivity(
    user,
    recentBarangKeluar,
    recentBarangMasuk,
    recentBarangKembali,
    recentLogs,
    { includeAllEditLogs: true }
  );
}

export async function getActivityPaginated(
  user: MonitoringUser,
  page: number,
  pageSize: number
) {
  const all = await fetchAllActivitySources(user);
  const total = all.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    data: all.slice(start, start + pageSize),
    total,
    totalPages,
    page: safePage,
  };
}

export async function getRecentActivity(user: MonitoringUser) {
  const isAdmin = user.role === "ADMIN";

  const [recentBarangKeluar, recentBarangMasuk, recentBarangKembali, recentLogs] =
    await Promise.all([
      fetchRecentBarangKeluar(ACTIVITY_SOURCE_LIMIT),
      isAdmin
        ? prisma.barangMasuk.findMany({
            take: ACTIVITY_SOURCE_LIMIT,
            orderBy: { tanggal_masuk: "desc" },
            include: recentBarangMasukInclude,
          })
        : Promise.resolve([]),
      prisma.barangKembali.findMany({
        take: ACTIVITY_SOURCE_LIMIT,
        orderBy: [{ tanggal_kembali: "desc" }, { id_kembali: "desc" }],
        include: recentBarangKembaliInclude,
      }),
      fetchRecentEditLogs(ACTIVITY_SOURCE_LIMIT),
    ]);

  return buildRecentActivity(
    user,
    recentBarangKeluar,
    recentBarangMasuk,
    recentBarangKembali,
    recentLogs,
    { limit: DASHBOARD_ACTIVITY_LIMIT }
  );
}

export type RecentActivity = Awaited<ReturnType<typeof getRecentActivity>>;
