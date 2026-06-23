"use client";

import Field from "@/components/ui/field";
import FormActions from "@/components/ui/form-actions";
import { useEffect, useState } from "react";

interface Merchandise {
  id_merch: number;
  nama_merch: string;
}

interface Stasiun {
  id_stasiun: number;
  nama_stasiun: string;
}

interface Kategori {
  id_kategori: number;
  nama_kategori: string;
}

interface BarangKeluarFormProps {
  initialData?: {
    id_merch: number;
    id_stasiun: number;
    id_kategori: number;
    jumlah: number;
    tanggal_keluar: string;
    keterangan?: string;
  };
  onSubmit: (data: {
    id_merch: number;
    id_stasiun: number;
    id_kategori: number;
    jumlah: number;
    tanggal_keluar: string;
    keterangan: string;
  }) => Promise<void>;
  loading?: boolean;
  cancelHref?: string;
}

export default function BarangKeluarForm({
  initialData,
  onSubmit,
  loading,
  cancelHref = "/barang-keluar",
}: BarangKeluarFormProps) {
  const [merchandise, setMerchandise] = useState<Merchandise[]>([]);
  const [stasiun, setStasiun] = useState<Stasiun[]>([]);
  const [kategori, setKategori] = useState<Kategori[]>([]);

  const [form, setForm] = useState({
    id_merch: initialData?.id_merch || 0,
    id_stasiun: initialData?.id_stasiun || 0,
    id_kategori: initialData?.id_kategori || 0,
    jumlah: initialData?.jumlah || 1,
    tanggal_keluar: initialData?.tanggal_keluar?.split("T")[0] || "",
    keterangan: initialData?.keterangan || "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/merchandise"),
      fetch("/api/stasiun"),
      fetch("/api/kategori"),
    ])
      .then(async ([merchRes, stasiunRes, kategoriRes]) => {
        if (merchRes.ok) setMerchandise(await merchRes.json());
        if (stasiunRes.ok) setStasiun(await stasiunRes.json());
        if (kategoriRes.ok) setKategori(await kategoriRes.json());
      })
      .catch(console.error);
  }, []);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="space-y-5"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Merchandise">
          <select
            required
            value={form.id_merch}
            onChange={(e) =>
              setForm({ ...form, id_merch: Number(e.target.value) })
            }
            className="input-field"
          >
            <option value="">Pilih Merchandise</option>
            {merchandise.map((item) => (
              <option key={item.id_merch} value={item.id_merch}>
                {item.nama_merch}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Stasiun Tujuan">
          <select
            required
            value={form.id_stasiun}
            onChange={(e) =>
              setForm({ ...form, id_stasiun: Number(e.target.value) })
            }
            className="input-field"
          >
            <option value="">Pilih Stasiun</option>
            {stasiun.map((item) => (
              <option key={item.id_stasiun} value={item.id_stasiun}>
                {item.nama_stasiun}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Kategori">
          <select
            required
            value={form.id_kategori}
            onChange={(e) =>
              setForm({ ...form, id_kategori: Number(e.target.value) })
            }
            className="input-field"
          >
            <option value="">Pilih Kategori</option>
            {kategori.map((item) => (
              <option key={item.id_kategori} value={item.id_kategori}>
                {item.nama_kategori}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Jumlah">
          <input
            required
            min={1}
            type="number"
            value={form.jumlah}
            onChange={(e) =>
              setForm({ ...form, jumlah: Number(e.target.value) })
            }
            className="input-field"
          />
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

      <FormActions loading={loading} cancelHref={cancelHref} />
    </form>
  );
}
