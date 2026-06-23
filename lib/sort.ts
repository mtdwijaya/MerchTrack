export type SortOrder = "asc" | "desc";

export function parseSortValue<T extends string>(
  value: string,
  defaultField: T,
  defaultOrder: SortOrder = "asc"
): { sortBy: T; sortOrder: SortOrder } {
  const [rawField, rawOrder] = value.split(":");

  return {
    sortBy: (rawField as T) || defaultField,
    sortOrder: rawOrder === "desc" ? "desc" : rawOrder === "asc" ? "asc" : defaultOrder,
  };
}

export function toggleSortValue<T extends string>(
  current: string,
  field: T
): string {
  const { sortBy, sortOrder } = parseSortValue(current, field);
  const nextOrder = sortBy === field && sortOrder === "asc" ? "desc" : "asc";
  return `${field}:${nextOrder}`;
}
