"use client";

import Field from "@/components/ui/field";
import FormActions from "@/components/ui/form-actions";
import { useState } from "react";

interface StasiunFormProps {
  initialData?: {
    kode_stasiun: string;
    nama_stasiun: string;
    alamat?: string;
    kontak?: string;
  };
  onSubmit: (data: {
    kode_stasiun: string;
    nama_stasiun: string;
    alamat: string;
    kontak: string;
  }) => Promise<void>;
  loading?: boolean;
  cancelHref?: string;
}

export default function StasiunForm({
  initialData,
  onSubmit,
  loading,
  cancelHref = "/stasiun",
}: StasiunFormProps) {
  const [form, setForm] = useState({
    kode_stasiun: initialData?.kode_stasiun ?? "",
    nama_stasiun: initialData?.nama_stasiun ?? "",
    alamat: initialData?.alamat ?? "",
    kontak: initialData?.kontak ?? "",
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
        <Field label="Kode Stasiun">
          <input
            type="text"
            required
            placeholder="Contoh: SDR, TNA, MRI"
            value={form.kode_stasiun}
            onChange={(e) =>
              setForm({ ...form, kode_stasiun: e.target.value.toUpperCase() })
            }
            className="input-field"
          />
        </Field>

        <Field label="Nama Stasiun">
          <input
            type="text"
            required
            placeholder="Contoh: Sudirman"
            value={form.nama_stasiun}
            onChange={(e) =>
              setForm({ ...form, nama_stasiun: e.target.value })
            }
            className="input-field"
          />
        </Field>
      </div>

      <Field label="Alamat">
        <textarea
          rows={3}
          placeholder="Alamat stasiun (opsional)"
          value={form.alamat}
          onChange={(e) => setForm({ ...form, alamat: e.target.value })}
          className="input-field resize-none"
        />
      </Field>

      <Field label="Kontak">
        <input
          type="text"
          placeholder="Nomor telepon (opsional)"
          value={form.kontak}
          onChange={(e) => setForm({ ...form, kontak: e.target.value })}
          className="input-field"
        />
      </Field>

      <FormActions loading={loading} cancelHref={cancelHref} />
    </form>
  );
}
