"use client";

import Field from "@/components/ui/field";
import FormActions from "@/components/ui/form-actions";
import { useState } from "react";

interface Props {
  initialData?: {
    kode_unit: string;
    nama_unit: string;
  };
  onSubmit: (data: { kode_unit: string; nama_unit: string }) => Promise<void>;
  loading?: boolean;
  onCancel?: () => void;
}

export default function UnitForm({
  initialData,
  onSubmit,
  loading,
  onCancel,
}: Props) {
  const [form, setForm] = useState({
    kode_unit: initialData?.kode_unit ?? "",
    nama_unit: initialData?.nama_unit ?? "",
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="space-y-5"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Kode Unit">
          <input
            type="text"
            required
            placeholder="Contoh: UNT-001"
            value={form.kode_unit}
            onChange={(e) =>
              setForm({ ...form, kode_unit: e.target.value.toUpperCase() })
            }
            className="input-field"
          />
        </Field>
        <Field label="Nama Unit">
          <input
            type="text"
            required
            placeholder="Contoh: Unit Humas"
            value={form.nama_unit}
            onChange={(e) =>
              setForm({ ...form, nama_unit: e.target.value })
            }
            className="input-field"
          />
        </Field>
      </div>

      <FormActions loading={loading} onCancel={onCancel} />
    </form>
  );
}
