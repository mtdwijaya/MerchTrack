"use client";

import type { TujuanOption } from "@/components/barang-keluar/status-badge";
import Field from "@/components/ui/field";
import FormActions from "@/components/ui/form-actions";
import BuktiUploadField from "@/components/ui/bukti-upload-field";
import { useState } from "react";

interface Merchandise {
  id_merch: number;
  nama_merch: string;
  jumlah_stok: number;
}

interface Stasiun {
  id_stasiun: number;
  nama_stasiun: string;
}

interface Unit {
  id_unit: number;
  nama_unit: string;
}

interface BarangKeluarFormProps {
  initialData?: {
    id_merch: number;
    id_tujuan: number;
    id_stasiun: number;
    id_unit: number;
    detail_teks: string;
    jumlah: number;
    jumlah_kembali?: number;
    tanggal_keluar: string;
    keterangan?: string;
    bukti_path?: string | null;
    bukti_nama?: string | null;
  };
  onSubmit: (
    data: {
      id_merch: number;
      id_tujuan: number;
      id_stasiun?: number;
      id_unit?: number;
      detail_teks?: string;
      jumlah: number;
      tanggal_keluar: string;
      keterangan: string;
    },
    bukti?: File | null
  ) => Promise<void>;
  loading?: boolean;
  cancelHref?: string;
  onCancel?: () => void;
  merchandiseList: Merchandise[];
  stasiunList: Stasiun[];
  unitList: Unit[];
  tujuanList: TujuanOption[];
}

export default function BarangKeluarForm({
  initialData,
  onSubmit,
  loading,
  cancelHref = "/barang-keluar",
  onCancel,
  merchandiseList,
  stasiunList,
  unitList,
  tujuanList,
}: BarangKeluarFormProps) {
  const [form, setForm] = useState({
    id_merch: initialData?.id_merch || 0,
    id_tujuan: initialData?.id_tujuan || 0,
    id_stasiun: initialData?.id_stasiun || 0,
    id_unit: initialData?.id_unit || 0,
    detail_teks: initialData?.detail_teks || "",
    jumlah: initialData?.jumlah || 1,
    tanggal_keluar: initialData?.tanggal_keluar?.split("T")[0] || "",
    keterangan: initialData?.keterangan || "",
  });
  const [bukti, setBukti] = useState<File | null>(null);

  const selectedTujuan = tujuanList.find(
    (item) => item.id_tujuan === form.id_tujuan
  );

  const lockStockFields = (initialData?.jumlah_kembali ?? 0) > 0;

  const stokSaatIni =
    form.id_merch > 0
      ? merchandiseList.find((item) => item.id_merch === form.id_merch)
          ?.jumlah_stok
      : undefined;

  function handleTujuanChange(id_tujuan: number) {
    setForm({
      ...form,
      id_tujuan,
      id_stasiun: 0,
      id_unit: 0,
      detail_teks: "",
    });
  }

  function renderDetailField() {
    if (!selectedTujuan) return null;

    switch (selectedTujuan.jenis_detail) {
      case "STASIUN":
        return (
          <Field label={selectedTujuan.label_detail ?? "Pilih Stasiun"}>
            <select
              required
              value={form.id_stasiun}
              onChange={(e) =>
                setForm({ ...form, id_stasiun: Number(e.target.value) })
              }
              className="input-field"
            >
              <option value="">Pilih Stasiun</option>
              {stasiunList.map((item) => (
                <option key={item.id_stasiun} value={item.id_stasiun}>
                  {item.nama_stasiun}
                </option>
              ))}
            </select>
          </Field>
        );
      case "UNIT":
        return (
          <Field label={selectedTujuan.label_detail ?? "Pilih Unit"}>
            <select
              required
              value={form.id_unit}
              onChange={(e) =>
                setForm({ ...form, id_unit: Number(e.target.value) })
              }
              className="input-field"
            >
              <option value="">Pilih Unit</option>
              {unitList.map((item) => (
                <option key={item.id_unit} value={item.id_unit}>
                  {item.nama_unit}
                </option>
              ))}
            </select>
          </Field>
        );
      case "TEKS":
        return (
          <Field label={selectedTujuan.label_detail ?? "Detail Tujuan"}>
            <input
              required
              type="text"
              value={form.detail_teks}
              onChange={(e) =>
                setForm({ ...form, detail_teks: e.target.value })
              }
              className="input-field"
              placeholder="Isi detail tujuan"
            />
          </Field>
        );
      default:
        return null;
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          id_merch: form.id_merch,
          id_tujuan: form.id_tujuan,
          id_stasiun: form.id_stasiun || undefined,
          id_unit: form.id_unit || undefined,
          detail_teks: form.detail_teks || undefined,
          jumlah: form.jumlah,
          tanggal_keluar: form.tanggal_keluar,
          keterangan: form.keterangan,
        }, bukti);
      }}
      className="space-y-5"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Merchandise">
          <select
            required
            disabled={lockStockFields}
            value={form.id_merch}
            onChange={(e) =>
              setForm({ ...form, id_merch: Number(e.target.value) })
            }
            className="input-field"
          >
            <option value="">Pilih Merchandise</option>
            {merchandiseList.map((item) => (
              <option key={item.id_merch} value={item.id_merch}>
                {item.nama_merch}
              </option>
            ))}
          </select>
          {lockStockFields && (
            <p className="mt-1.5 text-sm text-[#6B7280]">
              Merchandise tidak dapat diubah setelah ada pengembalian.
            </p>
          )}
        </Field>

        <Field label="Tujuan">
          <select
            required
            value={form.id_tujuan}
            onChange={(e) => handleTujuanChange(Number(e.target.value))}
            className="input-field"
          >
            <option value="">Pilih Tujuan</option>
            {tujuanList.map((item) => (
              <option key={item.id_tujuan} value={item.id_tujuan}>
                {item.nama_tujuan}
              </option>
            ))}
          </select>
        </Field>

        {renderDetailField()}

        <Field label="Jumlah">
          <input
            required
            min={1}
            type="number"
            disabled={lockStockFields}
            value={form.jumlah}
            onChange={(e) =>
              setForm({ ...form, jumlah: Number(e.target.value) })
            }
            className="input-field"
          />
          {lockStockFields && (
            <p className="mt-1.5 text-sm text-[#6B7280]">
              Jumlah tidak dapat diubah setelah ada pengembalian.
            </p>
          )}
          {!lockStockFields && stokSaatIni !== undefined && (
            <p className="mt-1.5 text-sm text-[#6B7280]">
              Stok saat ini:{" "}
              <span
                className={`font-semibold ${
                  stokSaatIni === 0 ? "text-[#B1070E]" : "text-[#1A1C1C]"
                }`}
              >
                {stokSaatIni.toLocaleString("id-ID")}
              </span>{" "}
              pcs
            </p>
          )}
        </Field>

        <Field label="Tanggal Keluar">
          <input
            required
            type="date"
            value={form.tanggal_keluar}
            onChange={(e) =>
              setForm({ ...form, tanggal_keluar: e.target.value })
            }
            className="input-field"
          />
        </Field>
      </div>

      <Field label="Keterangan">
        <textarea
          rows={4}
          value={form.keterangan}
          onChange={(e) =>
            setForm({ ...form, keterangan: e.target.value })
          }
          className="input-field"
          placeholder="Keterangan transaksi (opsional)"
        />
      </Field>

      <BuktiUploadField
        value={bukti}
        onChange={setBukti}
        existingFileName={initialData?.bukti_nama}
        existingFilePath={initialData?.bukti_path}
      />

      <FormActions
        loading={loading}
        cancelHref={cancelHref}
        onCancel={onCancel}
      />
    </form>
  );
}
