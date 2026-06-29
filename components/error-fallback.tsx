"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

type ErrorFallbackProps = {
  error: Error & { digest?: string };
  reset: () => void;
  compact?: boolean;
};

export function ErrorFallback({
  error,
  reset,
  compact = false,
}: ErrorFallbackProps) {
  const showDetail = process.env.NODE_ENV === "development";

  return (
    <div
      className={
        compact
          ? "flex min-h-[420px] items-center justify-center px-4"
          : "flex min-h-screen items-center justify-center bg-[#F6F3F0] px-4"
      }
    >
      <div
        className="
          w-full
          max-w-md
          rounded-xl
          border
          border-[#ECE8E4]
          bg-white
          px-8
          py-10
          text-center
          shadow-xl
        "
      >
        <p className="text-sm font-semibold uppercase tracking-widest text-[#D71920]">
          Terjadi Kesalahan
        </p>

        <h1 className="mt-3 text-2xl font-bold text-[#1A1C1C]">
          Gagal memuat halaman
        </h1>

        <p className="mt-3 text-sm leading-6 text-[#7A7A7A]">
          Sistem mengalami gangguan sementara. Coba muat ulang halaman atau
          kembali ke dashboard.
        </p>

        {showDetail && (
          <pre className="mt-4 max-h-32 overflow-auto rounded-lg bg-[#F3F4F6] p-3 text-left text-xs text-[#374151]">
            {error.message}
          </pre>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            type="button"
            onClick={reset}
            className="
              h-10
              bg-linear-to-r
              from-[#D71920]
              to-[#550101]
              text-white
              hover:opacity-95
            "
          >
            Coba Lagi
          </Button>

          <Link
            href="/dashboard"
            className="
              inline-flex
              h-10
              items-center
              justify-center
              rounded-lg
              border
              border-[#D9D9D9]
              bg-white
              px-4
              text-sm
              font-medium
              text-[#1A1C1C]
              hover:bg-[#F9FAFB]
            "
          >
            Ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
