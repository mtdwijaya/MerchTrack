"use client";

import { Download, ExternalLink, Eye, FileText } from "lucide-react";
import { useEffect, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type BuktiFileKind = "pdf" | "image" | "unknown";

// deteksi jenis file bukti dari ekstensi
export function getBuktiFileKind(path: string, name?: string) {
  const source = (name || path).toLowerCase();

  if (source.endsWith(".pdf")) return "pdf";
  if (/\.(jpe?g|png)$/.test(source)) return "image";
  return "unknown";
}

interface BuktiDocumentPreviewProps {
  path: string;
  name: string;
  title?: string;
}

function BuktiPreviewFrame({
  path,
  name,
  kind,
  className,
}: {
  path: string;
  name: string;
  kind: BuktiFileKind;
  className?: string;
}) {
  if (kind === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={path} alt={name} className={className} />
    );
  }

  if (kind === "pdf") {
    return <iframe src={path} title={name} className={className} />;
  }

  return (
    <div
      className={`flex items-center justify-center text-sm text-[#6B7280] ${className ?? ""}`}
    >
      Pratinjau tidak tersedia untuk format ini
    </div>
  );
}

const linkButtonClass = cn(
  buttonVariants({ variant: "outline", size: "sm" }),
  "inline-flex gap-1.5"
);

export default function BuktiDocumentPreview({
  path,
  name,
  title = "Bukti Dokumen",
}: BuktiDocumentPreviewProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const kind = getBuktiFileKind(path, name);
  const canPreview = kind === "pdf" || kind === "image";

  return (
    <>
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-2">
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#6B7280]" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#1A1C1C]">{title}</p>
              <p className="mt-0.5 truncate text-sm text-[#4B5563]">{name}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {canPreview && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreviewOpen(true)}
              >
                <Eye className="h-4 w-4" />
                Preview
              </Button>
            )}
            <a
              href={path}
              target="_blank"
              rel="noreferrer"
              className={linkButtonClass}
            >
              <ExternalLink className="h-4 w-4" />
              Buka
            </a>
            <a href={path} download={name} className={linkButtonClass}>
              <Download className="h-4 w-4" />
              Unduh
            </a>
          </div>
        </div>

        {canPreview && (
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="mt-4 block w-full overflow-hidden rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] text-left"
          >
            <BuktiPreviewFrame
              path={path}
              name={name}
              kind={kind}
              className="h-48 w-full bg-white object-contain"
            />
          </button>
        )}
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent
          className="flex h-[90vh] max-h-[90vh] flex-col gap-0 overflow-hidden border border-[#E5E7EB] p-0 sm:max-w-4xl"
          showCloseButton
        >
          <div className="flex items-center justify-between border-b border-[#EFEAE5] px-6 py-4">
            <DialogTitle className="truncate text-lg font-semibold text-[#1A1C1C]">
              Preview — {name}
            </DialogTitle>
            <a href={path} download={name} className={linkButtonClass}>
              <Download className="h-4 w-4" />
              Unduh
            </a>
          </div>

          <div className="min-h-0 flex-1 bg-[#F3F4F6]">
            <BuktiPreviewFrame
              path={path}
              name={name}
              kind={kind}
              className="h-full w-full border-0 bg-white"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface BuktiLocalPreviewProps {
  file: File;
}

// preview file yang baru dipilih di form (belum di-upload)
export function BuktiLocalPreview({ file }: BuktiLocalPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const kind = getBuktiFileKind(file.name);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!previewUrl || (kind !== "pdf" && kind !== "image")) {
    return (
      <p className="mt-2 text-sm text-[#4A4A4A]">
        File dipilih: <span className="font-medium">{file.name}</span>
      </p>
    );
  }

  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-[#E5E7EB] bg-[#FAFAFA]">
      <p className="border-b border-[#E5E7EB] px-3 py-2 text-xs text-[#6B7280]">
        Pratinjau:{" "}
        <span className="font-medium text-[#1A1C1C]">{file.name}</span>
      </p>
      {kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt={file.name}
          className="max-h-48 w-full bg-white object-contain"
        />
      ) : (
        <iframe
          src={previewUrl}
          title={file.name}
          className="h-48 w-full bg-white"
        />
      )}
    </div>
  );
}
