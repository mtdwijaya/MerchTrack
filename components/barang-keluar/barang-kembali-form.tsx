"use client";

import Field from "@/components/ui/field";
import FormActions from "@/components/ui/form-actions";
import { useState } from "react";

export type BarangKembaliGroupItem = {
  id_keluar: number;
  merchandise: string;
  jumlah: number;
  jumlah_kembali: number;
  sisa: number;
};

interface BarangKembaliFormProps {
  /** Satu atau lebih merch dalam grup transaksi */
  info: {
    tujuan: string;
    items: BarangKembaliGroupItem[];
  };
  onSubmit: (data: {
    tanggal_kembali: string;
    pengembali: string;
    asal: string;
    keterangan: string;
    items: { id_keluar: number; jumlah_kembali: number }[];
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
  const [shared, setShared] = useState({
    tanggal_kembali: new Date().toISOString().split("T")[0],
    pengembali: "",
    asal: "",
    keterangan: "",
  });

  const [qtyById, setQtyById] = useState<Record<number, number>>(() =>
    Object.fromEntries(
      info.items.map((item) => [
        item.id_keluar,
        // default: kembalikan semua sisa (bisa diubah per merch)
        item.sisa,
      ])
    )
  );

  const isMulti = info.items.length > 1;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          ...shared,
          items: info.items.map((item) => ({
            id_keluar: item.id_keluar,
            jumlah_kembali: qtyById[item.id_keluar] ?? 0,
          })),
        });
      }}
      className="space-y-5"
    >
      <div className="rounded-lg border border-[#EFEAE5] bg-[#FAFAFA] px-4 py-3 text-sm text-[#4B5563]">
        <p>
          Tujuan:{" "}
          <span className="font-medium text-[#1A1C1C]">{info.tujuan}</span>
        </p>
        <p className="mt-1">
          {isMulti
            ? `${info.items.length} merchandise — isi jumlah per item yang dikembalikan.`
            : "Isi jumlah yang dikembalikan untuk merchandise ini."}
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
          Merchandise dikembalikan
        </p>
        {info.items.map((item) => (
          <div
            key={item.id_keluar}
            className="grid gap-3 rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 sm:grid-cols-[1fr_140px] sm:items-end"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[#1A1C1C]">
                {item.merchandise}
              </p>
              <p className="mt-0.5 text-xs text-[#6B7280]">
                Keluar {item.jumlah} · Sudah kembali {item.jumlah_kembali} ·
                Sisa {item.sisa} pcs
              </p>
            </div>
            <Field label="Jumlah kembali">
              <input
                required={info.items.length === 1}
                min={0}
                max={item.sisa}
                type="number"
                value={qtyById[item.id_keluar] ?? 0}
                onChange={(e) =>
                  setQtyById((prev) => ({
                    ...prev,
                    [item.id_keluar]: Number(e.target.value),
                  }))
                }
                className="input-field"
              />
            </Field>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Tanggal Kembali">
          <input
            required
            type="date"
            value={shared.tanggal_kembali}
            onChange={(e) =>
              setShared({ ...shared, tanggal_kembali: e.target.value })
            }
            className="input-field"
          />
        </Field>

        <Field label="Pengembali">
          <input
            required
            type="text"
            value={shared.pengembali}
            onChange={(e) =>
              setShared({ ...shared, pengembali: e.target.value })
            }
            className="input-field"
            placeholder="Nama yang mengembalikan barang"
          />
        </Field>

        <Field label="Asal">
          <input
            required
            type="text"
            value={shared.asal}
            onChange={(e) => setShared({ ...shared, asal: e.target.value })}
            className="input-field"
            placeholder="cth: Stasiun Bekasi, Unit Operasi"
          />
        </Field>
      </div>

      <Field label="Catatan">
        <textarea
          rows={3}
          value={shared.keterangan}
          onChange={(e) =>
            setShared({ ...shared, keterangan: e.target.value })
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
