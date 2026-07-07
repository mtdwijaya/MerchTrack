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
