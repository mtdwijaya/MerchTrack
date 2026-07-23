"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// dialog konfirmasi — pakai shadcn Dialog biar konsisten
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Hapus",
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent showCloseButton={false} className="gap-5 sm:max-w-md">
        <DialogHeader className="gap-2 text-left">
          <DialogTitle className="text-lg font-semibold text-[#1A1C1C]">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-[#6B7280]">
            {message}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="-mx-0 -mb-0 gap-2 border-0 bg-transparent p-0 sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Batal
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
