"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import PenggunaForm from "@/components/pengguna/pengguna-form";
import PageHeader from "@/components/ui/page-header";

export default function TambahPenggunaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(data: {
    nama_user: string;
    email: string;
    password: string;
    role: "ADMIN" | "PETUGAS";
    id_stasiun?: number | null;
  }) {
    try {
      setLoading(true);
      const response = await fetch("/api/pengguna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      alert("Pengguna berhasil ditambahkan");
      router.push("/pengguna");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Tambah Pengguna" description="Buat akun admin atau petugas baru." />
      <div className="rounded-2xl border border-[#EFEAE5] bg-white p-6">
        <PenggunaForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  );
}
