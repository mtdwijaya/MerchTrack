"use client";

import { useState } from "react";

import Field from "@/components/ui/field";
import FormActions from "@/components/ui/form-actions";

interface MerchandiseRestockFormProps {
  nama_merch: string;
  stokSaatIni: number;
  onSubmit: (data: { jumlah: number; keterangan: string }) => Promise<void>;
  loading?: boolean;
  onCancel?: () => void;
}

export default function MerchandiseRestockForm({
  nama_merch,
  stokSaatIni,
  onSubmit,
  loading,
  onCancel,
}: MerchandiseRestockFormProps) {
  const [form, setForm] = useState({
    jumlah: 1,
    keterangan: "",
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="space-y-5"
    >
      <div className="rounded-xl border border-[#EFEAE5] bg-[#FAFAFA] px-4 py-3">
        <p className="text-sm font-medium text-[#1A1C1C]">{nama_merch}</p>
        <p className="mt-1 text-sm text-[#6B7280]">
          Stok saat ini:{" "}
          <span className="font-semibold text-[#1A1C1C]">{stokSaatIni}</span> pcs
        </p>
      </div>

      <Field label="Jumlah Restock">
        <input
          required
          min={1}
          type="number"
          value={form.jumlah}
          onChange={(e) => setForm({ ...form, jumlah: Number(e.target.value) })}
          className="input-field"
          placeholder="Masukkan jumlah penambahan stok"
        />
      </Field>

      <Field label="Keterangan">
        <textarea
          rows={3}
          value={form.keterangan}
          onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
          className="input-field"
          placeholder="Catatan restock (opsional)"
        />
      </Field>

      <FormActions
        loading={loading}
        submitLabel="Restock"
        loadingLabel="Menyimpan..."
        onCancel={onCancel}
      />
    </form>
  );
}
