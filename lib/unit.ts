import { revalidateTag, unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";

export const UNIT_CACHE_TAG = "unit";

async function fetchAllUnit() {
  return prisma.unit.findMany({
    orderBy: { nama_unit: "asc" },
  });
}

export const getAllUnit = unstable_cache(fetchAllUnit, ["all-unit"], {
  tags: [UNIT_CACHE_TAG],
});

export function revalidateUnitCache() {
  revalidateTag(UNIT_CACHE_TAG, "max");
}
