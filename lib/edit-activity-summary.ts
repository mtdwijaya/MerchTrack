import type { JenisDetailTujuan } from "@prisma/client";

import { formatDetailTujuan } from "@/lib/detail-tujuan";
import { formatTransaksiDate } from "@/lib/format-transaksi";

type KeluarSnapshot = {
  id_merch: number;
  id_tujuan: number;
  id_stasiun: number | null;
  id_unit: number | null;
  detail_teks: string | null;
  jumlah: number;
  tanggal_keluar: Date;
  keterangan: string | null;
  merchandise: { nama_merch: string };
  tujuan: { nama_tujuan: string; jenis_detail: JenisDetailTujuan };
  stasiun: { nama_stasiun: string } | null;
  unit: { nama_unit: string } | null;
};

type KeluarUpdate = {
  id_merch: number;
  id_tujuan: number;
  id_stasiun?: number | null;
  id_unit?: number | null;
  detail_teks?: string | null;
  jumlah: number;
  tanggal_keluar: Date;
  keterangan?: string | null;
  buktiBaru?: boolean;
};

type KeluarLabels = {
  merchandise?: string;
  tujuan?: KeluarSnapshot["tujuan"];
  stasiun?: { nama_stasiun: string } | null;
  unit?: { nama_unit: string } | null;
};

function detailLabel(
  tujuan: KeluarSnapshot["tujuan"],
  row: {
    detail_teks?: string | null;
    stasiun?: { nama_stasiun: string } | null;
    unit?: { nama_unit: string } | null;
  }
) {
  return formatDetailTujuan({
    tujuan,
    detail_teks: row.detail_teks ?? null,
    stasiun: row.stasiun ?? null,
    unit: row.unit ?? null,
  });
}

function sameDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function buildEditChangeSummary(
  before: KeluarSnapshot,
  after: KeluarUpdate,
  labels?: KeluarLabels
) {
  const changes: string[] = [];
  const tujuanAfter = labels?.tujuan ?? before.tujuan;
  const merchAfter = labels?.merchandise ?? before.merchandise.nama_merch;

  if (after.id_merch !== before.id_merch) {
    changes.push(
      `merchandise ${before.merchandise.nama_merch} → ${merchAfter}`
    );
  }

  if (after.id_tujuan !== before.id_tujuan) {
    changes.push(`tujuan ${before.tujuan.nama_tujuan} → ${tujuanAfter.nama_tujuan}`);
  }

  const detailBefore = detailLabel(before.tujuan, before);
  const detailAfter = detailLabel(tujuanAfter, {
    detail_teks: after.detail_teks ?? null,
    stasiun: labels?.stasiun ?? before.stasiun,
    unit: labels?.unit ?? before.unit,
  });

  if (detailBefore !== detailAfter) {
    changes.push(`detail ${detailBefore} → ${detailAfter}`);
  }

  if (after.jumlah !== before.jumlah) {
    changes.push(
      `jumlah ${before.jumlah.toLocaleString("id-ID")} → ${after.jumlah.toLocaleString("id-ID")} pcs`
    );
  }

  if (!sameDate(after.tanggal_keluar, before.tanggal_keluar)) {
    changes.push(
      `tanggal ${formatTransaksiDate(before.tanggal_keluar)} → ${formatTransaksiDate(after.tanggal_keluar)}`
    );
  }

  const keteranganBefore = before.keterangan?.trim() || "-";
  const keteranganAfter = after.keterangan?.trim() || "-";
  if (keteranganBefore !== keteranganAfter) {
    changes.push("keterangan");
  }

  if (after.buktiBaru) {
    changes.push("bukti dokumen");
  }

  return changes;
}

export function buildEditActivityPesan(
  actor: string,
  trxId: string,
  merchandise: string,
  changes: string[],
  occurredAt: Date = new Date()
) {
  const summary =
    changes.length > 0 ? changes.join(", ") : "data transaksi";
  const body = `${actor} mengedit ${trxId} · ${merchandise} · ubah: ${summary}`;
  return `@${occurredAt.toISOString()}@${body}`;
}

export function parseEditActivityPesan(pesan: string) {
  let occurredAt: string | null = null;
  let body = pesan;

  const stamped = pesan.match(/^@([^@]+)@([\s\S]+)$/);
  if (stamped) {
    occurredAt = stamped[1];
    body = stamped[2];
  }

  const modern = body.match(
    /^(.+?) mengedit (#(?:OUT|TRX)-\d+) · (.+?) · ubah: (.+)$/
  );
  if (modern) {
    return {
      actor: modern[1],
      trx: modern[2],
      merch: modern[3],
      changes: modern[4],
      occurredAt,
    };
  }

  const legacy = body.match(
    /^(.+?) mengedit transaksi barang keluar (.+?) \((#(?:OUT|TRX)-\d+)\)/
  );
  if (legacy) {
    return {
      actor: legacy[1],
      trx: legacy[3],
      merch: legacy[2],
      changes: "data transaksi",
      occurredAt,
    };
  }

  return {
    actor: "Petugas",
    trx: "",
    merch: body.replace(/\.$/, ""),
    changes: "data transaksi",
    occurredAt,
  };
}
