import Link from "next/link";
import { Eye, Pencil, SlidersHorizontal, Trash2, Undo2 } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

// aksi edit via link (halaman merchandise/stasiun dll)
export function EditLinkAction({ href }: { href: string }) {
  return (
    <Link
      href={href}
      title="Edit"
      className={cn(buttonVariants({ variant: "outline", size: "icon" }))}
    >
      <Pencil className="h-4 w-4" />
    </Link>
  );
}

// aksi kembalikan barang (barang keluar)
export function ReturnAction({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      title="Kembalikan Barang"
    >
      <Undo2 className="h-4 w-4" />
    </Button>
  );
}
