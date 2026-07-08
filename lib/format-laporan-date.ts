const BULAN_SINGKAT = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MEI",
  "JUN",
  "JUL",
  "AGU",
  "SEP",
  "OKT",
  "NOV",
  "DES",
] as const;

export function getLaporanDateParts(date: string | Date) {
  const d = new Date(date);
  return {
    day: d.getDate(),
    month: BULAN_SINGKAT[d.getMonth()],
    year: d.getFullYear(),
  };
}
