/** LRT Jabodebek design system — chart color tokens */
export const CHART_COLORS = {
  primary: "#D32F2F",
  primary600: "#C62828",
  primary700: "#B71C1C",
  primary200: "#EF9A9A",
  primary50: "#FFF5F5",
} as const;

/** Gradasi merah: tergelap (nilai tertinggi) → terang (nilai terendah) */
export const CHART_BAR_GRADIENT = [
  CHART_COLORS.primary700,
  CHART_COLORS.primary600,
  CHART_COLORS.primary,
  CHART_COLORS.primary200,
  "#FFCDD2",
] as const;

/** Palet series stacked bar — dinamis per merchandise */
export const CHART_SERIES_PALETTE = [
  "#B71C1C",
  "#D32F2F",
  "#E57373",
  "#EF9A9A",
  "#FFCDD2",
  "#8D6E63",
  "#546E7A",
  "#455A64",
  "#6D4C41",
  "#C62828",
] as const;

export function colorForSeriesIndex(index: number) {
  return CHART_SERIES_PALETTE[index % CHART_SERIES_PALETTE.length];
}

/** Urutan nama merch sama dengan stacked bar & sankey — warna konsisten antar chart */
export function sortedMerchKeys(names: Iterable<string>) {
  return [...new Set(names)].sort((a, b) => a.localeCompare(b, "id"));
}

export function buildMerchColorMap(names: Iterable<string>) {
  const keys = sortedMerchKeys(names);
  return new Map(keys.map((name, index) => [name, colorForSeriesIndex(index)]));
}

/** Palet node tujuan (kanan sankey) — netral, beda dari series merch */
export const CHART_TUJUAN_PALETTE = [
  "#546E7A",
  "#607D8B",
  "#78909C",
  "#90A4AE",
  "#B0BEC5",
  "#6D4C41",
  "#8D6E63",
  "#A1887F",
] as const;

export function colorForTujuanIndex(index: number) {
  return CHART_TUJUAN_PALETTE[index % CHART_TUJUAN_PALETTE.length];
}

export function buildTujuanColorMap(names: Iterable<string>) {
  const keys = sortedMerchKeys(names);
  return new Map(keys.map((name, index) => [name, colorForTujuanIndex(index)]));
}

function gradientColorForRank(rank: number, total: number) {
  if (total <= 1) return CHART_BAR_GRADIENT[0];
  const index = Math.round(
    (rank / (total - 1)) * (CHART_BAR_GRADIENT.length - 1)
  );
  return CHART_BAR_GRADIENT[index];
}

/** Map index data → warna berdasarkan ranking nilai (tertinggi = paling gelap) */
export function buildValueColorMap(totals: number[]) {
  const ranked = totals
    .map((total, index) => ({ index, total }))
    .sort((a, b) => b.total - a.total);

  const map = new Map<number, string>();
  ranked.forEach((item, rank) => {
    map.set(item.index, gradientColorForRank(rank, totals.length));
  });

  return map;
}

export function getPieColorByValueRank(rank: number, total: number) {
  return gradientColorForRank(rank, total);
}
