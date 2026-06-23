export function formatTransaksiId(id: number) {
  return `#TRX-${String(id).padStart(5, "0")}`;
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
