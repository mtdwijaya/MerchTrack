"use client";

import { useState } from "react";

import Field from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import type {
  LaporanJenis,
  LaporanPeriode,
} from "@/lib/laporan-generate";

export type LaporanGenerateFormValues = {
  jenis: LaporanJenis;
  id_merch: number | null;
  periode: LaporanPeriode;
  tanggal_dari: string;
  tanggal_sampai: string;
};

interface MerchandiseOption {
  id_merch: number;
  nama_merch: string;
}

interface Props {
  merchandiseList: MerchandiseOption[];
  loading?: boolean;
  onCancel?: () => void;
  onGenerate: (values: LaporanGenerateFormValues) => Promise<void>;
}

const PERIODE_OPTIONS: { value: LaporanPeriode; label: string }[] = [
  { value: "1", label: "1 hari (hari ini)" },
  { value: "7", label: "7 hari terakhir" },
  { value: "30", label: "30 hari terakhir" },
  { value: "custom", label: "Rentang tanggal" },
  { value: "semua", label: "Semua waktu" },
];

export default function LaporanGenerateForm({
  merchandiseList,
  loading,
  onCancel,
  onGenerate,
}: Props) {
  const [form, setForm] = useState<LaporanGenerateFormValues>({
    jenis: "semua",
    id_merch: null,
    periode: "30",
    tanggal_dari: "",
    tanggal_sampai: "",
  });

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Jenis Transaksi">
          <select
            value={form.jenis}
            onChange={(e) =>
              setForm({ ...form, jenis: e.target.value as LaporanJenis })
            }
            className="input-field"
          >
            <option value="semua">Keluar & Masuk</option>
            <option value="keluar">Barang Keluar</option>
            <option value="masuk">Barang Masuk</option>
          </select>
        </Field>

        <Field label="Merchandise">
          <select
            value={form.id_merch ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                id_merch: e.target.value ? Number(e.target.value) : null,
              })
            }
            className="input-field"
          >
            <option value="">Semua merchandise</option>
            {merchandiseList.map((item) => (
              <option key={item.id_merch} value={item.id_merch}>
                {item.nama_merch}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Rentang Waktu">
          <select
            value={form.periode}
            onChange={(e) =>
              setForm({
                ...form,
                periode: e.target.value as LaporanPeriode,
              })
            }
            className="input-field"
          >
            {PERIODE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>

        <div className="hidden md:block" />

        {form.periode === "custom" && (
          <>
            <Field label="Tanggal Mulai">
              <input
                required
                type="date"
                value={form.tanggal_dari}
                onChange={(e) =>
                  setForm({ ...form, tanggal_dari: e.target.value })
                }
                className="input-field"
              />
            </Field>
            <Field label="Tanggal Akhir">
              <input
                required
                type="date"
                value={form.tanggal_sampai}
                onChange={(e) =>
                  setForm({ ...form, tanggal_sampai: e.target.value })
                }
                className="input-field"
              />
            </Field>
          </>
        )}
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-[#EFEAE5] pt-4 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={onCancel}
          >
            Batal
          </Button>
        )}
        <Button
          type="button"
          disabled={loading}
          onClick={() => onGenerate(form)}
          className="bg-[#B1070E] text-white hover:bg-[#8F060B]"
        >
          {loading ? "Menyiapkan..." : "Generate"}
        </Button>
      </div>
    </div>
  );
}
