"use client";

import Field from "@/components/ui/field";
import FormActions from "@/components/ui/form-actions";
import { useState } from "react";

interface BarangKembaliFormProps {
  info: {
    merchandise: string;
    tujuan: string;
    jumlah: number;
    jumlah_kembali: number;
    sisa: number;
  };
  onSubmit: (data: {
    jumlah_kembali: number;
    tanggal_kembali: string;
    pengembali: string;
    asal: string;
    keterangan: string;
  }) => Promise<void>;
  loading?: boolean;
  onCancel?: () => void;
}

export default function BarangKembaliForm({
  info,
  onSubmit,
  loading,
  onCancel,
}: BarangKembaliFormProps) {
  const [form, setForm] = useState({
    jumlah_kembali: info.sisa > 0 ? info.sisa : 1,
    tanggal_kembali: new Date().toISOString().split("T")[0],
    pengembali: "",
    asal: "",
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
      <div className="rounded-lg border border-[#EFEAE5] bg-[#FAFAFA] px-4 py-3 text-sm text-[#4B5563]">
        <p>
          <span className="font-medium text-[#1A1C1C]">{info.merchandise}</span>{" "}
          — {info.tujuan}
        </p>
        <p className="mt-1">
          Keluar awal: <strong>{info.jumlah}</strong> pcs · Sudah kembali:{" "}
          <strong>{info.jumlah_kembali}</strong> pcs · Sisa bisa dikembalikan:{" "}
          <strong>{info.sisa}</strong> pcs
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Jumlah Dikembalikan">
          <input
            required
            min={1}
            max={info.sisa}
            type="number"
            value={form.jumlah_kembali}
            onChange={(e) =>
              setForm({ ...form, jumlah_kembali: Number(e.target.value) })
            }
            className="input-field"
          />
        </Field>

        <Field label="Tanggal Kembali">
          <input
            required
            type="date"
            value={form.tanggal_kembali}
            onChange={(e) =>
              setForm({ ...form, tanggal_kembali: e.target.value })
            }
            className="input-field"
          />
        </Field>

        <Field label="Pengembali">
          <input
            required
            type="text"
            value={form.pengembali}
            onChange={(e) =>
              setForm({ ...form, pengembali: e.target.value })
            }
            className="input-field"
            placeholder="Nama yang mengembalikan barang"
          />
        </Field>

        <Field label="Asal">
          <input
            required
            type="text"
            value={form.asal}
            onChange={(e) => setForm({ ...form, asal: e.target.value })}
            className="input-field"
            placeholder="cth: Stasiun Bekasi, Unit Operasi"
          />
        </Field>
      </div>

      <Field label="Catatan">
        <textarea
          rows={3}
          value={form.keterangan}
          onChange={(e) =>
            setForm({ ...form, keterangan: e.target.value })
          }
          className="input-field"
          placeholder="Catatan pengembalian (opsional)"
        />
      </Field>

      <FormActions
        loading={loading}
        submitLabel="Simpan Pengembalian"
        onCancel={onCancel}
      />
    </form>
  );
}
