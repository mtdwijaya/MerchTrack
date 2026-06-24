"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import BarangKeluarForm from "@/components/barang-keluar/barang-keluar-form";
import { showError, showSuccess } from "@/lib/toast";

export default function TambahBarangKeluarPage() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    data: any
  ) {
    try {
      setLoading(true);

      const response = await fetch(
        "/api/barang-keluar",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(data),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message
        );
      }

      showSuccess("Barang keluar berhasil ditambahkan");

      router.push(
        "/barang-keluar"
      );
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Tambah Barang Keluar
        </h1>

        <p className="text-gray-500 mt-2">
          Catat transaksi barang
          keluar baru.
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
          onSubmit={
            handleSubmit
          }
          loading={loading}
        />
      </div>
    </div>
  );
}