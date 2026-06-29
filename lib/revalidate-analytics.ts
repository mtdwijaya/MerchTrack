import { revalidatePath, revalidateTag } from "next/cache";

export const ANALYTICS_CACHE_TAG = "analytics";

// invalidasi cache statistik dashboard/monitoring + refresh halaman terkait
export function revalidateAnalyticsPages() {
  revalidateTag(ANALYTICS_CACHE_TAG, "max");
  revalidatePath("/dashboard");
  revalidatePath("/monitoring");
}
