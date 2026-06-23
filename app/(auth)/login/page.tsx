
"use client";

import Image from "next/image";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setIsPending(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Login gagal. Silakan coba lagi."
        );
        setIsPending(false);
        return;
      }

      setEmail("");
      setPassword("");
      setError("");

      router.refresh();
      router.push("/dashboard");
    } catch (error) {
      console.error(error);

      setError(
        "Terjadi kesalahan. Silakan coba lagi."
      );

      setIsPending(false);
    }
  };

  return (
    <div
      className="
        min-h-screen
        flex
        items-center
        justify-center
        bg-[#F6F3F0]
        relative
        overflow-hidden
      "
    >
      {/* Background Decoration Top Right */}
      <div className="absolute top-0 right-0 w-80 h-80 opacity-40">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full border-40 border-[#EEDADA]" />
        <div className="absolute top-10 right-10 w-60 h-60 rounded-full border-30 border-[#F2E3E3]" />
        <div className="absolute top-20 right-20 w-40 h-40 rounded-full border-20 border-[#F6EBEB]" />
      </div>

      {/* Background Decoration Bottom Left */}
      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#F0E3E3] opacity-60" />

      {/* Login Card */}
      <div
        className="
          w-105
          bg-white
          rounded-xl
          shadow-xl
          px-8
          py-10
          border
          border-[#ECE8E4]
        "
      >
        {/* Logo LRT */}
        <div className="flex justify-center mb-5">
          <Image
            src="/logos/logoLRT.svg"
            alt="LRT"
            width={75}
            height={25}
            priority
          />
        </div>

        {/* Logo MerchTrack */}
        <div className="flex justify-center mb-5">
          <Image
            src="/logos/MerchTrack.svg"
            alt="MerchTrack"
            width={210}
            height={70}
            priority
          />
        </div>

        <p className="text-center text-[#7A7A7A] text-sm mb-8">
          Silakan login untuk mengakses sistem
        </p>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-[#333]">
              Email address
            </label>

            <input
              type="email"
              placeholder="admin@lrt.co.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
              required
              className="
                w-full
                h-12
                rounded-lg
                border
                border-[#D9D9D9]
                px-4
                text-[#1A1C1C]
                placeholder:text-[#9CA3AF]
                outline-none
                focus:border-[#D71920]
                disabled:bg-gray-100
                disabled:cursor-not-allowed
              "
            />
          </div>

          {/* Password */}
          <div className="mb-2">
            <label className="block text-sm font-medium mb-2 text-[#333]">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="password123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
                required
                className="
                  w-full
                  h-12
                  rounded-lg
                  border
                  border-[#D9D9D9]
                  px-4
                  pr-12
                  text-[#1A1C1C]
                  placeholder:text-[#9CA3AF]
                  outline-none
                  focus:border-[#D71920]
                  disabled:bg-gray-100
                  disabled:cursor-not-allowed
                "
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isPending}
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                className="
                  absolute
                  right-4
                  top-1/2
                  -translate-y-1/2
                  text-[#6B7280]
                  hover:text-[#1A1C1C]
                  disabled:opacity-50
                "
              >
                {showPassword ? (
                  
                  <Eye size={20} />
                ) : (
                  <EyeOff size={20} />
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-xs text-[#D71920] mb-4">
              {error}
            </p>
          )}

          {/* Remember Me */}
          <div className="flex justify-between items-center mb-6 mt-4">
            <label className="flex items-center gap-2 text-sm text-[#666]">
              <input type="checkbox" />
              Remember me
            </label>

            <button
              type="button"
              className="
                text-sm
                text-[#0B66C3]
                font-medium
                hover:underline
              "
            >
              Forgot password?
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="
              w-full
              h-12
              rounded-lg
              text-white
              font-semibold
              bg-linear-to-r
              from-[#D71920]
              to-[#550101]
              hover:opacity-95
              transition
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
          >
            {isPending ? "Signing In..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

