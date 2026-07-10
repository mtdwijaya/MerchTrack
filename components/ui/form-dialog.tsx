"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  loading?: boolean;
  contentClassName?: string;
  children: React.ReactNode;
}

export default function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  loading, 
  contentClassName,
  children,
}: FormDialogProps) {
  // ga render dialog sama sekali kalo closed — hemat DOM
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[min(90dvh,920px)] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl",
          contentClassName
        )}
      >
        <DialogHeader className="shrink-0 border-b border-[#EFEAE5] px-6 py-4 pr-12">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-6 py-4">
          {loading ? (
            <p className="py-8 text-center text-sm text-gray-500">
              Memuat data...
            </p>
          ) : (
            children
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
