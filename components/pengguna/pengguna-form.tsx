"use client";

import { useState } from "react";

import Field from "@/components/ui/field";
import FormActions from "@/components/ui/form-actions";

interface StasiunOption {
  id_stasiun: number;
  nama_stasiun: string;
}

interface PenggunaFormProps {
  initialData?: {
    nama_user: string;
    email: string;
    role: "ADMIN" | "PETUGAS";
    id_stasiun?: number | null;
  };
  onSubmit: (data: {
    nama_user: string;
    email: string;
    password: string;
    role: "ADMIN" | "PETUGAS";
    id_stasiun?: number | null;
  }) => Promise<void>;
  loading?: boolean;
  isEdit?: boolean;
  cancelHref?: string;
  onCancel?: () => void;
  stasiunList: StasiunOption[];
}

export default function PenggunaForm({
  initialData,
  onSubmit,
  loading,
  isEdit,
  cancelHref = "/pengguna",
  onCancel,
  stasiunList,
}: PenggunaFormProps) {
  const [form, setForm] = useState({
    nama_user: initialData?.nama_user ?? "",
    email: initialData?.email ?? "",
    password: "",
    role: initialData?.role ?? "PETUGAS",
    id_stasiun: initialData?.id_stasiun ?? "",
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          nama_user: form.nama_user,
          email: form.email,
          password: form.password,
          role: form.role as "ADMIN" | "PETUGAS",
          id_stasiun: form.id_stasiun ? Number(form.id_stasiun) : null,
        });
      }}
      className="space-y-5"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Nama Pengguna">
          <input
            required
            type="text"
            value={form.nama_user}
            onChange={(e) => setForm({ ...form, nama_user: e.target.value })}
            className="input-field"
          />
        </Field>

        <Field label="Email">
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="input-field"
          />
        </Field>

        <Field label={isEdit ? "Password Baru (opsional)" : "Password"}>
          <input
            required={!isEdit}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="input-field"
            placeholder={isEdit ? "Kosongkan jika tidak diubah" : ""}
          />
        </Field>

        <Field label="Role">
          <select
            required
            value={form.role}
            onChange={(e) =>
              setForm({
                ...form,
                role: e.target.value as "ADMIN" | "PETUGAS",
              })
            }
            className="input-field"
          >
            <option value="PETUGAS">Petugas</option>
            <option value="ADMIN">Admin</option>
          </select>
        </Field>

        <Field label="Stasiun (opsional)">
          <select
            value={form.id_stasiun}
            onChange={(e) => setForm({ ...form, id_stasiun: e.target.value })}
            className="input-field"
          >
            <option value="">Tidak ada stasiun</option>
            {stasiunList.map((item) => (
              <option key={item.id_stasiun} value={item.id_stasiun}>
                {item.nama_stasiun}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <FormActions
        loading={loading}
        cancelHref={cancelHref}
        onCancel={onCancel}
      />
    </form>
  );
}
