export function formatTransaksiId(id: number) {
  return `#OUT-${String(id).padStart(5, "0")}`;
}

export function parseTransaksiNumber(trx: string) {
  const match = trx.match(/#(?:OUT|TRX)-(\d+)/i);
  return match ? Number(match[1]) : null;
}

export function formatTransaksiDate(date: string | Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}
