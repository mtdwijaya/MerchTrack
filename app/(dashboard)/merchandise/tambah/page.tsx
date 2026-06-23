"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import MerchandiseForm from "@/components/merchandise/merchandise-form";
import PageHeader from "@/components/ui/page-header";

export default function TambahMerchandisePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(data: {
    nama_merch: string;
    deskripsi: string;
    jumlah_stok: number;
  }) {
    try {
      setLoading(true);
      const response = await fetch("/api/merchandise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      alert("Merchandise berhasil ditambahkan");
      router.push("/merchandise");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Tambah Merchandise" description="Tambahkan merchandise baru ke gudang pusat." />
      <div className="rounded-2xl border border-[#EFEAE5] bg-white p-6">
        <MerchandiseForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  );
}
