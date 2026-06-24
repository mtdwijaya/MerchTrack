"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import MerchandiseForm from "@/components/merchandise/merchandise-form";
import PageHeader from "@/components/ui/page-header";
import { showError, showSuccessAndGo } from "@/lib/toast";

export default function EditMerchandisePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<{
    nama_merch: string;
    deskripsi?: string;
    jumlah_stok?: number;
  } | null>(null);

  useEffect(() => {
    fetch(`/api/merchandise/${params.id}`)
      .then((res) => res.json())
      .then((result) => {
        if (!result.id_merch) throw new Error();
        setData({
          nama_merch: result.nama_merch,
          deskripsi: result.deskripsi ?? "",
          jumlah_stok: result.stok?.jumlah_stok ?? 0,
        });
      })
      .catch(() => {
        showError("Gagal memuat data");
        router.push("/merchandise");
      })
      .finally(() => setLoading(false));
  }, [params.id, router]);

  async function handleSubmit(formData: {
    nama_merch: string;
    deskripsi: string;
    jumlah_stok: number;
  }) {
    try {
      setSaving(true);
      const response = await fetch(`/api/merchandise/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      showSuccessAndGo("Merchandise berhasil diperbarui", () => router.push("/merchandise"));
    } catch (error) {
      showError(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="py-10 text-center text-sm text-gray-500">Memuat data...</div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Merchandise" description="Perbarui data merchandise dan stok." />
      <div className="rounded-2xl border border-[#EFEAE5] bg-white p-6">
        <MerchandiseForm initialData={data ?? undefined} onSubmit={handleSubmit} loading={saving} />
      </div>
    </div>
  );
}
