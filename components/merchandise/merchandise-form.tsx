"use client";

import { useState } from "react";

import Field from "@/components/ui/field";
import FormActions from "@/components/ui/form-actions";

interface MerchandiseFormProps {
  initialData?: {
    nama_merch: string;
    deskripsi?: string;
    jumlah_stok?: number;
  };
  onSubmit: (data: {
    nama_merch: string;
    deskripsi: string;
    jumlah_stok?: number;
  }) => Promise<void>;
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
  const [form, setForm] = useState({
    nama_merch: initialData?.nama_merch ?? "",
    deskripsi: initialData?.deskripsi ?? "",
    jumlah_stok: initialData?.jumlah_stok ?? 0,
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (isEdit) {
          onSubmit({
            nama_merch: form.nama_merch,
            deskripsi: form.deskripsi,
          });
          return;
        }

        onSubmit(form);
      }}
      className="space-y-5"
    >
      <div className={isEdit ? "space-y-5" : "grid gap-5 md:grid-cols-2"}>
        <Field label="Nama Merchandise">
          <input
            required
            type="text"
            value={form.nama_merch}
            onChange={(e) => setForm({ ...form, nama_merch: e.target.value })}
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

      <FormActions
        loading={loading}
        cancelHref={cancelHref}
        onCancel={onCancel}
      />
    </form>
  );
}
