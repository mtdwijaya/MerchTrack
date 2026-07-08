"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

interface FormActionsProps {
  loading?: boolean;
  submitLabel?: string;
  cancelHref?: string;
  onCancel?: () => void;
  loadingLabel?: string;
}

// tombol batal/simpan di bawah form modal
export default function FormActions({
  loading,
  submitLabel = "Simpan",
  cancelHref,
  onCancel,
  loadingLabel = "Menyimpan...",
}: FormActionsProps) {
  const router = useRouter();

  function handleCancel() {
    // prioritas: callback custom > href > back browser
    if (onCancel) {
      onCancel();
      return;
    }
    if (cancelHref) {
      router.push(cancelHref);
      return;
    }
    router.back();
  }

  return (
    <div className="flex justify-end gap-3 pt-2">
      <Button type="button" variant="outline" onClick={handleCancel}>
        Batal
      </Button>

      <Button type="submit" variant="brand" disabled={loading}>
        {loading ? loadingLabel : submitLabel}
      </Button>
    </div>
  );
}
