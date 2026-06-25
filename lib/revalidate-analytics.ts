import { revalidatePath } from "next/cache";

// panggil setelah transaksi agar dashboard & monitoring menampilkan data terbaru
export function revalidateAnalyticsPages() {
  revalidatePath("/dashboard");
  revalidatePath("/monitoring");
}
