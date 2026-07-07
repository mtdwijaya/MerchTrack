import { revalidatePath, revalidateTag } from "next/cache";

import { ANALYTICS_CACHE_TAG } from "@/lib/analytics-cache-tag";
// invalidasi cache statistik dashboard/monitoring + refresh halaman terkait
export function revalidateAnalyticsPages() {
  revalidateTag(ANALYTICS_CACHE_TAG, "max");
  revalidatePath("/dashboard");
  revalidatePath("/monitoring");
}
