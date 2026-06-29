import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F3F0] px-4">
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
        <p className="text-5xl font-bold text-[#D71920]">404</p>

        <h1 className="mt-3 text-2xl font-bold text-[#1A1C1C]">
          Halaman tidak ditemukan
        </h1>

        <p className="mt-3 text-sm leading-6 text-[#7A7A7A]">
          URL yang Anda buka tidak ada atau sudah dipindahkan.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="
              inline-flex
              h-10
              items-center
              justify-center
              rounded-lg
              bg-linear-to-r
              from-[#D71920]
              to-[#550101]
              px-4
              text-sm
              font-semibold
              text-white
              hover:opacity-95
            "
          >
            Ke Dashboard
          </Link>

          <Link
            href="/login"
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
            Ke Login
          </Link>
        </div>
      </div>
    </div>
  );
}
