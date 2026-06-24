"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import StasiunForm from "@/components/stasiun/stasiun-form";
import { showError, showSuccessAndGo } from "@/lib/toast";

export default function EditStasiunPage() {
  const params = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<{
    kode_stasiun: string;
    nama_stasiun: string;
    alamat?: string;
    kontak?: string;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const response = await fetch(`/api/stasiun/${params.id}`);

      if (!response.ok) {
        throw new Error("Stasiun tidak ditemukan");
      }

      const result = await response.json();

      setData({
        kode_stasiun: result.kode_stasiun,
        nama_stasiun: result.nama_stasiun,
        alamat: result.alamat ?? "",
        kontak: result.kontak ?? "",
      });
    } catch (error) {
      console.error(error);
      showError("Gagal memuat data stasiun");
      router.push("/stasiun");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(formData: {
    kode_stasiun: string;
    nama_stasiun: string;
    alamat: string;
    kontak: string;
  }) {
    try {
      setSaving(true);

      const response = await fetch(`/api/stasiun/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message);
      }

      showSuccessAndGo("Stasiun berhasil diperbarui", () => router.push("/stasiun"));
    } catch (error) {
      showError(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="py-10 text-center text-sm text-gray-500">
        Memuat data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-[#1A1C1C]">
          Edit Stasiun
        </h1>
        <p className="mt-1 text-sm text-[#5B4040]">
          Perbarui data stasiun penerima distribusi merchandise.
        </p>
      </div>

      <div className="rounded-2xl border border-[#EFEAE5] bg-white p-6">
        <StasiunForm
          initialData={data ?? undefined}
          onSubmit={handleSubmit}
          loading={saving}
        />
      </div>
    </div>
  );
}
