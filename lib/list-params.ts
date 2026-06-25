export type SearchParams = Record<
  string,
  string | string[] | undefined
>;

export function getParam(
  params: SearchParams,
  key: string,
  fallback = ""
): string {
  const value = params[key];
  return typeof value === "string" ? value : fallback;
}

export function getPageParam(
  params: SearchParams,
  fallback = 1
): number {
  const page = Number(getParam(params, "page", "1"));
  return Number.isFinite(page) && page > 0 ? page : fallback;
}

export function getOptionalNumberParam(
  params: SearchParams,
  key: string
): number | undefined {
  const value = getParam(params, key);
  if (!value) return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}
