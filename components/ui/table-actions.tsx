import { Eye, SlidersHorizontal, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

// tombol teks outline kecil di tabel
export function TextOutlineAction({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </Button>
  );
}

// tombol detail / kelola di tabel monitoring & riwayat
export function DetailsAction({
  onClick,
  label = "Details",
  variant = "view",
}: {
  onClick: () => void;
  label?: string;
  variant?: "view" | "manage";
}) {
  const Icon = variant === "manage" ? SlidersHorizontal : Eye;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      className="gap-1.5"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  );
}

export function DeleteAction({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={onClick}
      title="Hapus"
      className="text-[#B71C1C] hover:text-[#D32F2F]"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
