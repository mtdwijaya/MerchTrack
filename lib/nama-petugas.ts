/** Label petugas transaksi: free-text form, fallback akun login (data lama). */
export function resolveNamaPetugas(
  namaPetugas?: string | null,
  fallbackAkun?: string | null
) {
  const fromForm = namaPetugas?.trim();
  if (fromForm) return fromForm;
  const fromUser = fallbackAkun?.trim();
  if (fromUser) return fromUser;
  return "-";
}
