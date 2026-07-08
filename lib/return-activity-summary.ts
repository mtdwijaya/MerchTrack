import { formatTransaksiId } from "@/lib/format-transaksi";

export function buildReturnActivityPesan(
  actor: string,
  jumlahKembali: number,
  merchandise: string,
  idKeluar: number
) {
  return `${actor} mengembalikan ${jumlahKembali.toLocaleString("id-ID")} pcs · ${merchandise} · ${formatTransaksiId(idKeluar)}`;
}

export function parseReturnActivityPesan(pesan: string) {
  const modern = pesan.match(
    /^(.+?) mengembalikan ([\d.,]+) pcs · (.+?) · (#(?:OUT|TRX)-\d+)$/
  );
  if (modern) {
    return {
      actor: modern[1],
      qty: modern[2],
      merch: modern[3],
      trx: modern[4],
    };
  }

  return {
    actor: "Petugas",
    qty: "",
    merch: pesan.replace(/\.$/, ""),
    trx: "",
  };
}
