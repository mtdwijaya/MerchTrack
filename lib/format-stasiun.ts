export function formatStasiunId(id: number) {
  return `BK-${String(id).padStart(3, "0")}`;
}
