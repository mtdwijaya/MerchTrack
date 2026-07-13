"use client";

import Field from "@/components/ui/field";
import FormActions from "@/components/ui/form-actions";
import type { JenisDetailTujuan } from "@prisma/client";
import { useState } from "react";

export type TujuanFormValues = {
  nama_tujuan: string;
  jenis_detail: JenisDetailTujuan;
  label_detail: string;
  boleh_return: boolean;
};

interface Props {
  initialData?: TujuanFormValues;
  onSubmit: (data: TujuanFormValues) => Promise<void>;
  loading?: boolean;
  onCancel?: () => void;
}

/** Tujuan baru selalu free text; jenis Stasiun/Unit/dll sudah fix di seed. */
const DEFAULT_JENIS: JenisDetailTujuan = "TEKS";
const DEFAULT_LABEL = "Detail tujuan";

export default function TujuanForm({
  initialData,
  onSubmit,
  loading,
  onCancel,
}: Props) {
  const jenis = initialData?.jenis_detail ?? DEFAULT_JENIS;
  const [form, setForm] = useState({
    nama_tujuan: initialData?.nama_tujuan ?? "",
    label_detail: initialData?.label_detail ?? DEFAULT_LABEL,
    boleh_return: initialData?.boleh_return ?? false,
  });

  const needsLabel = jenis !== "TIDAK_ADA";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          nama_tujuan: form.nama_tujuan,
          jenis_detail: jenis,
          label_detail: needsLabel ? form.label_detail : "",
          boleh_return: form.boleh_return,
        });
      }}
      className="space-y-5"
    >
      <Field label="Nama Tujuan">
        <input
          type="text"
          required
          placeholder="Contoh: Sponsorship, Kerjasama"
          value={form.nama_tujuan}
          onChange={(e) => setForm({ ...form, nama_tujuan: e.target.value })}
          className="input-field"
        />
      </Field>

      {needsLabel && (
        <Field label="Label Detail di Form">
          <input
            type="text"
            required
            placeholder={DEFAULT_LABEL}
            value={form.label_detail}
            onChange={(e) =>
              setForm({ ...form, label_detail: e.target.value })
            }
            className="input-field"
          />
        </Field>
      )}

      <label className="flex items-center gap-2 text-sm text-[#1A1C1C]">
        <input
          type="checkbox"
          checked={form.boleh_return}
          onChange={(e) =>
            setForm({ ...form, boleh_return: e.target.checked })
          }
          className="h-4 w-4 rounded border-[#D1D5DB]"
        />
        Boleh dikembalikan (return)
      </label>

      <FormActions loading={loading} onCancel={onCancel} />
    </form>
  );
}
