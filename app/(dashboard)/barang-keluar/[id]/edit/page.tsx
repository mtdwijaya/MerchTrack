"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import BarangKeluarForm from "@/components/barang-keluar/barang-keluar-form";
import { showError, showSuccessAndGo } from "@/lib/toast";

export default function EditBarangKeluarPage() {
  const params = useParams();
  const router = useRouter();

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [data, setData] =
    useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const response = await fetch(
        `/api/barang-keluar/${params.id}`
      );

      if (!response.ok) {
        throw new Error(
          "Data tidak ditemukan"
        );
      }

      const result =
        await response.json();

      setData({
        id_merch:
          result.id_merch,

        id_stasiun:
          result.id_stasiun,

        id_kategori:
          result.id_kategori,

        jumlah:
          result.jumlah,

        tanggal_keluar:
          result.tanggal_keluar,

        keterangan:
          result.keterangan ?? "",
      });
    } catch (error) {
      console.error(error);

      showError("Gagal memuat data");

      router.push(
        "/barang-keluar"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(
    formData: any
  ) {
    try {
      setSaving(true);

      const response = await fetch(
        `/api/barang-keluar/${params.id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            formData
          ),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message
        );
      }

      showSuccessAndGo("Data berhasil diperbarui", () =>
        router.push("/barang-keluar")
      );
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        Memuat data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Edit Barang Keluar
        </h1>

        <p className="text-gray-500 mt-2">
          Perbarui transaksi
          barang keluar.
        </p>
      </div>

      <div
        className="
          bg-white
          border
          border-[#EFEAE5]
          rounded-2xl
          p-6
        "
      >
        <BarangKeluarForm
          initialData={data}
          onSubmit={
            handleSubmit
          }
          loading={saving}
        />
      </div>
    </div>
  );
}