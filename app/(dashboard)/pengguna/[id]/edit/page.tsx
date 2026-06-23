"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import PenggunaForm from "@/components/pengguna/pengguna-form";
import PageHeader from "@/components/ui/page-header";

export default function EditPenggunaPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<{
    nama_user: string;
    email: string;
    role: "ADMIN" | "PETUGAS";
    id_stasiun?: number | null;
  } | null>(null);

  useEffect(() => {
    fetch(`/api/pengguna/${params.id}`)
      .then((res) => res.json())
      .then((result) => {
        if (!result.id_user) throw new Error();
        setData({
          nama_user: result.nama_user,
          email: result.email,
          role: result.role,
          id_stasiun: result.stasiun?.id_stasiun ?? null,
        });
      })
      .catch(() => {
        alert("Gagal memuat data");
        router.push("/pengguna");
      })
      .finally(() => setLoading(false));
  }, [params.id, router]);

  async function handleSubmit(formData: {
    nama_user: string;
    email: string;
    password: string;
    role: "ADMIN" | "PETUGAS";
    id_stasiun?: number | null;
  }) {
    try {
      setSaving(true);
      const response = await fetch(`/api/pengguna/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      alert("Pengguna berhasil diperbarui");
      router.push("/pengguna");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="py-10 text-center text-sm text-gray-500">Memuat data...</div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Pengguna" description="Perbarui data akun pengguna." />
      <div className="rounded-2xl border border-[#EFEAE5] bg-white p-6">
        <PenggunaForm initialData={data ?? undefined} onSubmit={handleSubmit} loading={saving} isEdit />
      </div>
    </div>
  );
}
