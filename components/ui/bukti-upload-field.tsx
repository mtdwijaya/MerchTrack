"use client";

import BuktiDocumentPreview, {
  BuktiLocalPreview,
} from "@/components/ui/bukti-document-preview";
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
}

export default function BuktiUploadField({
  value,
  onChange,
  existingFileName,
  existingFilePath,
}: BuktiUploadFieldProps) {
  return (
    <Field label="Upload Bukti Dokumen">
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          if (file && file.size > MAX_SIZE_BYTES) {
            alert("Ukuran file maksimal 5MB");
            e.target.value = "";
            onChange(null);
            return;
          }
          if (file && !isAllowedClientFile(file)) {
            alert("Format file harus PDF, JPG, atau PNG");
            e.target.value = "";
            onChange(null);
            return;
          }
          onChange(file);
        }}
        className="input-field w-full cursor-pointer text-sm text-[#4A4A4A] file:mr-3 file:rounded-md file:border-0 file:bg-[#FFF5F5] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#D32F2F]"
      />
      <p className="mt-1.5 text-xs text-[#9A9A9A]">
        PDF, JPG, atau PNG — maksimal 5MB
      </p>
      {value ? (
        <BuktiLocalPreview file={value} />
      ) : null}
      {!value && existingFileName && existingFilePath ? (
        <div className="mt-3">
          <BuktiDocumentPreview
            path={existingFilePath}
            name={existingFileName}
            title="Bukti Saat Ini"
          />
        </div>
      ) : !value && existingFileName ? (
        <p className="mt-1 text-sm text-[#4A4A4A]">
          File saat ini:{" "}
          <span className="font-medium">{existingFileName}</span>
        </p>
      ) : null}
    </Field>
  );
}
