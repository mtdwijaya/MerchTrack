"use client";

import { useRouter } from "next/navigation";

interface FormActionsProps {
  loading?: boolean;
  submitLabel?: string;
  cancelHref?: string;
  onCancel?: () => void;
  loadingLabel?: string;
}

export default function FormActions({
  loading,
  submitLabel = "Simpan",
  cancelHref,
  onCancel,
  loadingLabel = "Menyimpan...",
}: FormActionsProps) {
  const router = useRouter();

  return (
    <div className="flex justify-end gap-3 pt-2">
      <button
        type="button"
        onClick={() => {
          if (onCancel) onCancel();
          else if (cancelHref) router.push(cancelHref);
          else router.back();
        }}
        className="
          rounded-xl border border-[#E2E2E2]
          px-6 py-3 text-sm font-medium text-[#1A1C1C]
          hover:bg-gray-50
        "
      >
        Batal
      </button>

      <button
        type="submit"
        disabled={loading}
        className="
          rounded-xl bg-[#B1070E] px-6 py-3
          text-sm font-medium text-white shadow-md
          hover:bg-[#93060c] disabled:opacity-50
        "
      >
        {loading ? loadingLabel : submitLabel}
      </button>
    </div>
  );
}
