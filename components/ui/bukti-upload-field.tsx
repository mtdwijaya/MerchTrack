"use client";

import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";

import ConfirmDialog from "@/components/ui/confirm-dialog";
import BuktiDocumentPreview, {
  BuktiLocalPreview,
} from "@/components/ui/bukti-document-preview";
import { Button } from "@/components/ui/button";
import Field from "@/components/ui/field";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"];

function isAllowedClientFile(file: File) {
  if (ALLOWED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext))) {
    return true;
  }

  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
  ];

  return file.type ? allowedTypes.includes(file.type) : false;
}

interface BuktiUploadFieldProps {
  value: File | null;
  onChange: (file: File | null) => void;
  existingFileName?: string | null;
  existingFilePath?: string | null;
  /** true = user ingin hapus file tersimpan (tanpa upload baru) */
  removeExisting?: boolean;
  onRemoveExistingChange?: (remove: boolean) => void;
  label?: string;
}

export default function BuktiUploadField({
  value,
  onChange,
  existingFileName,
  existingFilePath,
  removeExisting = false,
  onRemoveExistingChange,
  label = "Upload Bukti Dokumen",
}: BuktiUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const hasExisting =
    Boolean(existingFilePath) &&
    Boolean(existingFileName) &&
    !removeExisting &&
    !value;

  function resetInput() {
    if (inputRef.current) inputRef.current.value = "";
  }

  function applyFile(file: File) {
    onRemoveExistingChange?.(false);
    onChange(file);
  }

  function handleFilePick(file: File | null) {
    if (!file) {
      onChange(null);
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      alert("Ukuran file maksimal 5MB");
      resetInput();
      onChange(null);
      return;
    }

    if (!isAllowedClientFile(file)) {
      alert("Format file harus PDF, JPG, atau PNG");
      resetInput();
      onChange(null);
      return;
    }

    if (
      (Boolean(existingFilePath) && !removeExisting) ||
      Boolean(value)
    ) {
      setPendingFile(file);
      setConfirmReplace(true);
      return;
    }

    applyFile(file);
  }

  function handleConfirmReplace() {
    if (pendingFile) applyFile(pendingFile);
    setPendingFile(null);
    setConfirmReplace(false);
  }

  function handleCancelReplace() {
    setPendingFile(null);
    setConfirmReplace(false);
    resetInput();
  }

  function handleConfirmDelete() {
    onChange(null);
    onRemoveExistingChange?.(true);
    setConfirmDelete(false);
    resetInput();
  }

  return (
    <>
      <Field label={label}>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          onChange={(e) => {
            handleFilePick(e.target.files?.[0] ?? null);
          }}
          className="input-field w-full cursor-pointer text-sm text-[#4A4A4A] file:mr-3 file:rounded-md file:border-0 file:bg-[#FFF5F5] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#D32F2F]"
        />
        <p className="mt-1.5 text-xs text-[#9A9A9A]">
          PDF, JPG, atau PNG — maksimal 5MB
        </p>

        {value && (
          <div className="mt-3 space-y-2">
            <BuktiLocalPreview file={value} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-[#B1070E]"
              onClick={() => {
                onChange(null);
                resetInput();
              }}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Batalkan file baru
            </Button>
          </div>
        )}

        {hasExisting && existingFilePath && existingFileName && (
          <div className="mt-3 space-y-2">
            <BuktiDocumentPreview
              path={existingFilePath}
              name={existingFileName}
              title="Dokumen tersimpan"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-[#B1070E]"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Hapus dokumen
            </Button>
          </div>
        )}

        {removeExisting && !value && (
          <p className="mt-2 text-xs font-medium text-[#B1070E]">
            Dokumen akan dihapus saat disimpan.
          </p>
        )}
      </Field>

      <ConfirmDialog
        open={confirmReplace}
        title="Ganti dokumen?"
        message="File lama akan diganti dengan file baru. File lama ikut dihapus dari penyimpanan. Lanjutkan?"
        confirmLabel="Ganti"
        onConfirm={handleConfirmReplace}
        onCancel={handleCancelReplace}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Hapus dokumen?"
        message="Dokumen tersimpan akan dihapus setelah Anda menyimpan form. Lanjutkan?"
        confirmLabel="Hapus"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
