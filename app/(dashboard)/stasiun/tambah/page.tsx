"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import StasiunForm from "@/components/stasiun/stasiun-form";
import { showError, showSuccess } from "@/lib/toast";

export default function TambahStasiunPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(data: {
    kode_stasiun: string;
    nama_stasiun: string;
    alamat: string;
    kontak: string;
  }) {
    try {
      setLoading(true);
  //  membuat stasiun baru

      const response = await fetch("/api/stasiun", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message);
      }

      showSuccess("Stasiun berhasil ditambahkan");
      router.push("/stasiun");
    } catch (error) {
      showError(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-[#1A1C1C]">
          Tambah Stasiun Baru
        </h1>
        <p className="mt-1 text-sm text-[#5B4040]">
          Tambahkan stasiun penerima distribusi merchandise.
        </p>
      </div>

      <div className="rounded-2xl border border-[#EFEAE5] bg-white p-6">
        {/* narik form stasiun dari components/stasiun/stasiun-form.tsx */}
        <StasiunForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  );
}
