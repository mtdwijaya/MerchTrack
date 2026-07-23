"use client";

import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";

import ConfirmDialog from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import Field from "@/components/ui/field";
import FormActions from "@/components/ui/form-actions";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

function isAllowedFoto(file: File) {
  if (ALLOWED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext))) {
    return true;
  }
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  return file.type ? allowedTypes.includes(file.type) : false;
}

export type MerchandiseFormSubmitData = {
  nama_merch: string;
  deskripsi: string;
  jumlah_stok?: number;
  foto?: File | null;
  hapus_foto?: boolean;
};

interface MerchandiseFormProps {
  initialData?: {
    nama_merch: string;
    deskripsi?: string;
    jumlah_stok?: number;
    foto_path?: string | null;
    foto_nama?: string | null;
  };
  onSubmit: (data: MerchandiseFormSubmitData) => Promise<void>;
  loading?: boolean;
  cancelHref?: string;
  onCancel?: () => void;
  isEdit?: boolean;
}

export default function MerchandiseForm({
  initialData,
  onSubmit,
  loading,
  cancelHref = "/merchandise",
  onCancel,
  isEdit,
}: MerchandiseFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    nama_merch: initialData?.nama_merch ?? "",
    deskripsi: initialData?.deskripsi ?? "",
    jumlah_stok: initialData?.jumlah_stok ?? 0,
  });
  const [foto, setFoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hapusFoto, setHapusFoto] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const existingFoto =
    initialData?.foto_path && !hapusFoto && !foto
      ? initialData.foto_path
      : null;

  function resetInput() {
    if (inputRef.current) inputRef.current.value = "";
  }

  function applyFoto(file: File) {
    setHapusFoto(false);
    setFoto(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handleFotoPick(file: File | null) {
    if (!file) {
      setFoto(null);
      setPreviewUrl(null);
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      alert("Ukuran foto maksimal 5MB");
      resetInput();
      return;
    }
    if (!isAllowedFoto(file)) {
      alert("Format foto harus JPG, PNG, atau WEBP");
      resetInput();
      return;
    }

    if ((initialData?.foto_path && !hapusFoto) || foto) {
      setPendingFile(file);
      setConfirmReplace(true);
      return;
    }

    applyFoto(file);
  }

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (isEdit) {
            onSubmit({
              nama_merch: form.nama_merch,
              deskripsi: form.deskripsi,
              foto,
              hapus_foto: hapusFoto,
            });
            return;
          }

          onSubmit({ ...form, foto, hapus_foto: false });
        }}
        className="space-y-5"
      >
        <div className={isEdit ? "space-y-5" : "grid gap-5 md:grid-cols-2"}>
          <Field label="Nama Merchandise">
            <input
              required
              type="text"
              value={form.nama_merch}
              onChange={(e) =>
                setForm({ ...form, nama_merch: e.target.value })
              }
              className="input-field"
              placeholder="Contoh: Tumbler LRT"
            />
          </Field>

          {!isEdit && (
            <Field label="Stok Awal">
              <input
                required
                min={0}
                type="number"
                value={form.jumlah_stok}
                onChange={(e) =>
                  setForm({ ...form, jumlah_stok: Number(e.target.value) })
                }
                className="input-field"
              />
            </Field>
          )}
        </div>

        <Field label="Deskripsi">
          <textarea
            rows={4}
            value={form.deskripsi}
            onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
            className="input-field"
            placeholder="Deskripsi merchandise (opsional)"
          />
        </Field>

        <Field label="Foto Merchandise">
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={(e) => handleFotoPick(e.target.files?.[0] ?? null)}
            className="input-field w-full cursor-pointer text-sm text-[#4A4A4A] file:mr-3 file:rounded-md file:border-0 file:bg-[#FFF5F5] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#D32F2F]"
          />
          <p className="mt-1.5 text-xs text-[#9A9A9A]">
            JPG, PNG, atau WEBP — maksimal 5MB (opsional)
          </p>

          {(previewUrl || existingFoto) && (
            <div className="mt-3 space-y-2">
              <div className="overflow-hidden rounded-lg border border-[#EFEAE5] bg-[#FAFAFA]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl ?? existingFoto!}
                  alt={form.nama_merch || "Preview foto merchandise"}
                  className="h-36 w-full object-contain"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-[#B1070E]"
                onClick={() => {
                  if (foto) {
                    setFoto(null);
                    setPreviewUrl(null);
                    resetInput();
                    return;
                  }
                  setConfirmDelete(true);
                }}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                {foto ? "Batalkan foto baru" : "Hapus foto"}
              </Button>
            </div>
          )}

          {hapusFoto && !foto && (
            <p className="mt-2 text-xs font-medium text-[#B1070E]">
              Foto akan dihapus saat disimpan.
            </p>
          )}
        </Field>

        <FormActions
          loading={loading}
          cancelHref={cancelHref}
          onCancel={onCancel}
        />
      </form>

      <ConfirmDialog
        open={confirmReplace}
        title="Ganti foto?"
        message="Foto lama akan diganti dengan foto baru. Foto lama ikut dihapus dari penyimpanan. Lanjutkan?"
        confirmLabel="Ganti"
        onConfirm={() => {
          if (pendingFile) applyFoto(pendingFile);
          setPendingFile(null);
          setConfirmReplace(false);
        }}
        onCancel={() => {
          setPendingFile(null);
          setConfirmReplace(false);
          resetInput();
        }}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Hapus foto?"
        message="Foto tersimpan akan dihapus setelah Anda menyimpan form. Lanjutkan?"
        confirmLabel="Hapus"
        onConfirm={() => {
          setFoto(null);
          setPreviewUrl(null);
          setHapusFoto(true);
          setConfirmDelete(false);
          resetInput();
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
