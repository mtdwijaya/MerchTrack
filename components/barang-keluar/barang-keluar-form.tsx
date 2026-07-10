"use client";

import type { TujuanOption } from "@/components/barang-keluar/status-badge";
import Field from "@/components/ui/field";
import FormActions from "@/components/ui/form-actions";
import BuktiUploadField from "@/components/ui/bukti-upload-field";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
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

type MerchItemRow = {
  id_merch: number;
  jumlah: number;
};

export type BarangKeluarFormSubmitData = {
  id_tujuan: number;
  id_stasiun?: number;
  id_unit?: number;
  detail_teks?: string;
  tanggal_keluar: string;
  keterangan: string;
  items: MerchItemRow[];
};

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
    data: BarangKeluarFormSubmitData,
    bukti?: File | null
  ) => Promise<void>;
  loading?: boolean;
  cancelHref?: string;
  onCancel?: () => void;
  merchandiseList: Merchandise[];
  stasiunList: Stasiun[];
  unitList: Unit[];
  tujuanList: TujuanOption[];
  isEdit?: boolean;
}

function createEmptyItem(): MerchItemRow {
  return { id_merch: 0, jumlah: 1 };
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
  isEdit = false,
}: BarangKeluarFormProps) {
  const [header, setHeader] = useState({
    id_tujuan: initialData?.id_tujuan || 0,
    id_stasiun: initialData?.id_stasiun || 0,
    id_unit: initialData?.id_unit || 0,
    detail_teks: initialData?.detail_teks || "",
    tanggal_keluar: initialData?.tanggal_keluar?.split("T")[0] || "",
    keterangan: initialData?.keterangan || "",
  });
  const [items, setItems] = useState<MerchItemRow[]>(
    initialData
      ? [{ id_merch: initialData.id_merch, jumlah: initialData.jumlah }]
      : [createEmptyItem()]
  );
  const [bukti, setBukti] = useState<File | null>(null);

  const selectedTujuan = tujuanList.find(
    (item) => item.id_tujuan === header.id_tujuan
  );

  const lockStockFields = (initialData?.jumlah_kembali ?? 0) > 0;
  const canManageItems = !isEdit && !lockStockFields;

  function handleTujuanChange(id_tujuan: number) {
    setHeader({
      ...header,
      id_tujuan,
      id_stasiun: 0,
      id_unit: 0,
      detail_teks: "",
    });
  }

  function updateItem(index: number, patch: Partial<MerchItemRow>) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      )
    );
  }

  function addItem() {
    setItems((current) => [...current, createEmptyItem()]);
  }

  function removeItem(index: number) {
    setItems((current) =>
      current.length <= 1 ? current : current.filter((_, i) => i !== index)
    );
  }

  function getStokSaatIni(id_merch: number) {
    return merchandiseList.find((item) => item.id_merch === id_merch)
      ?.jumlah_stok;
  }

  function renderDetailField() {
    if (!selectedTujuan) return null;

    switch (selectedTujuan.jenis_detail) {
      case "STASIUN":
        return (
          <Field label={selectedTujuan.label_detail ?? "Pilih Stasiun"}>
            <select
              required
              value={header.id_stasiun}
              onChange={(e) =>
                setHeader({ ...header, id_stasiun: Number(e.target.value) })
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
              value={header.id_unit}
              onChange={(e) =>
                setHeader({ ...header, id_unit: Number(e.target.value) })
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
              value={header.detail_teks}
              onChange={(e) =>
                setHeader({ ...header, detail_teks: e.target.value })
              }
              className="input-field"
              placeholder="Contoh: Fun Run LRT 2026"
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
        onSubmit(
          {
            id_tujuan: header.id_tujuan,
            id_stasiun: header.id_stasiun || undefined,
            id_unit: header.id_unit || undefined,
            detail_teks: header.detail_teks || undefined,
            tanggal_keluar: header.tanggal_keluar,
            keterangan: header.keterangan,
            items: items.filter((item) => item.id_merch > 0),
          },
          bukti
        );
      }}
      className="space-y-6"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-[2rem_1fr_7rem_2.5rem] items-center gap-3 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
          <span>#</span>
          <span>Pilih Merchandise</span>
          <span>Jumlah</span>
          <span className="sr-only">Aksi</span>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => {
            const stokSaatIni = getStokSaatIni(item.id_merch);

            return (
              <div
                key={index}
                className="grid grid-cols-[2rem_1fr_7rem_2.5rem] items-start gap-3"
              >
                <span className="pt-2.5 text-sm font-medium text-[#6B7280]">
                  {index + 1}
                </span>

                <div>
                  <select
                    required
                    disabled={lockStockFields}
                    value={item.id_merch || ""}
                    onChange={(e) =>
                      updateItem(index, { id_merch: Number(e.target.value) })
                    }
                    className="input-field"
                  >
                    <option value="">Pilih Merchandise</option>
                    {merchandiseList.map((merch) => (
                      <option key={merch.id_merch} value={merch.id_merch}>
                        {merch.nama_merch}
                      </option>
                    ))}
                  </select>
                  {!lockStockFields && stokSaatIni !== undefined && (
                    <p className="mt-1.5 text-xs text-[#6B7280]">
                      Stok:{" "}
                      <span
                        className={`font-semibold ${
                          stokSaatIni === 0
                            ? "text-[#B1070E]"
                            : "text-[#1A1C1C]"
                        }`}
                      >
                        {stokSaatIni.toLocaleString("id-ID")}
                      </span>{" "}
                      pcs
                    </p>
                  )}
                </div>

                <input
                  required
                  min={1}
                  type="number"
                  disabled={lockStockFields}
                  value={item.jumlah}
                  onChange={(e) =>
                    updateItem(index, { jumlah: Number(e.target.value) })
                  }
                  className="input-field"
                />

                {canManageItems ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-0.5 text-[#B1070E] hover:bg-[#FFF2F2] hover:text-[#B1070E]"
                    disabled={items.length <= 1}
                    onClick={() => removeItem(index)}
                    aria-label={`Hapus item ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : (
                  <span />
                )}
              </div>
            );
          })}
        </div>

        {canManageItems && (
          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed"
            onClick={addItem}
          >
            <Plus className="mr-2 h-4 w-4" />
            Tambah Item
          </Button>
        )}

        {lockStockFields && (
          <p className="text-sm text-[#6B7280]">
            Merchandise dan jumlah tidak dapat diubah setelah ada pengembalian.
          </p>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Tujuan">
          <select
            required
            value={header.id_tujuan}
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

        {renderDetailField() ?? <div className="hidden md:block" />}

        <div className="md:col-span-2">
          <Field label="Tanggal Transaksi">
            <input
              required
              type="date"
              value={header.tanggal_keluar}
              onChange={(e) =>
                setHeader({ ...header, tanggal_keluar: e.target.value })
              }
              className="input-field"
            />
          </Field>
        </div>
      </div>

      <Field label="Catatan">
        <textarea
          rows={4}
          value={header.keterangan}
          onChange={(e) =>
            setHeader({ ...header, keterangan: e.target.value })
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
        submitLabel={isEdit ? "Simpan" : "Lanjut"}
      />
    </form>
  );
}
