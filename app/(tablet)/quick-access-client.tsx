"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Minus,
  Package,
  Plus,
  ShoppingCart,
  UserRound,
} from "lucide-react";

import type { TujuanOption } from "@/components/barang-keluar/status-badge";
import {
  confirmQuickOutAction,
  confirmQuickReturnAction,
  logoutTabletAction,
} from "./actions";

export type CatalogItem = {
  id_merch: number;
  nama_merch: string;
  foto_path: string | null;
  jumlah_stok: number;
};

type StasiunOption = { id_stasiun: number; nama_stasiun: string };
type UnitOption = { id_unit: number; nama_unit: string };

type Mode = "OUT" | "RETURN";

type Setup = {
  mode: Mode;
  nama_petugas: string;
  id_tujuan: number | "";
  id_stasiun: number | "";
  id_unit: number | "";
  detail_teks: string;
};

type Props = {
  userName: string;
  merchandise: CatalogItem[];
  petugasOptions: string[];
  tujuanList: TujuanOption[];
  stasiunList: StasiunOption[];
  unitList: UnitOption[];
};

export default function QuickAccessClient({
  userName,
  merchandise,
  petugasOptions,
  tujuanList,
  stasiunList,
  unitList,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<"mode" | "petugas" | "catalog">("mode");
  const [setup, setSetup] = useState<Setup>({
    mode: "OUT",
    nama_petugas: "",
    id_tujuan: "",
    id_stasiun: "",
    id_unit: "",
    detail_teks: "",
  });
  const [qty, setQty] = useState<Record<number, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [showCart, setShowCart] = useState(false);

  const selectedTujuan = useMemo(
    () => tujuanList.find((t) => t.id_tujuan === setup.id_tujuan) ?? null,
    [tujuanList, setup.id_tujuan]
  );

  const cartItems = useMemo(
    () =>
      merchandise
        .map((item) => ({
          ...item,
          jumlah: qty[item.id_merch] ?? 0,
        }))
        .filter((item) => item.jumlah > 0),
    [merchandise, qty]
  );

  const cartCount = cartItems.reduce((sum, item) => sum + item.jumlah, 0);

  function setItemQty(id: number, next: number, maxStock: number) {
    const capped =
      setup.mode === "OUT"
        ? Math.max(0, Math.min(next, maxStock))
        : Math.max(0, next);
    setQty((prev) => {
      if (capped <= 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: capped };
    });
  }

  function resetSession() {
    setQty({});
    setSetup({
      mode: "OUT",
      nama_petugas: "",
      id_tujuan: "",
      id_stasiun: "",
      id_unit: "",
      detail_teks: "",
    });
    setStep("mode");
    setError(null);
    setSuccess(null);
    setShowCart(false);
  }

  function continueFromPetugas() {
    setError(null);
    if (!setup.nama_petugas.trim()) {
      setError("Pilih nama petugas terlebih dahulu");
      return;
    }
    if (setup.mode === "OUT") {
      if (!setup.id_tujuan) {
        setError("Pilih tujuan distribusi");
        return;
      }
      if (selectedTujuan?.jenis_detail === "STASIUN" && !setup.id_stasiun) {
        setError(selectedTujuan.label_detail ?? "Stasiun wajib dipilih");
        return;
      }
      if (selectedTujuan?.jenis_detail === "UNIT" && !setup.id_unit) {
        setError(selectedTujuan.label_detail ?? "Unit wajib dipilih");
        return;
      }
      if (
        selectedTujuan?.jenis_detail === "TEKS" &&
        !setup.detail_teks.trim()
      ) {
        setError(selectedTujuan.label_detail ?? "Detail tujuan wajib diisi");
        return;
      }
    }
    setStep("catalog");
  }

  function handleConfirm() {
    setError(null);
    setSuccess(null);
    if (cartItems.length === 0) {
      setError("Pilih minimal 1 merchandise");
      return;
    }

    startTransition(async () => {
      const items = cartItems.map((item) => ({
        id_merch: item.id_merch,
        jumlah: item.jumlah,
      }));

      const result =
        setup.mode === "OUT"
          ? await confirmQuickOutAction({
              nama_petugas: setup.nama_petugas,
              id_tujuan: setup.id_tujuan,
              id_stasiun: setup.id_stasiun || null,
              id_unit: setup.id_unit || null,
              detail_teks: setup.detail_teks || null,
              items,
            })
          : await confirmQuickReturnAction({
              nama_petugas: setup.nama_petugas,
              items,
            });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setSuccess(
        setup.mode === "OUT"
          ? "Barang keluar berhasil dicatat"
          : "Pengembalian stok berhasil dicatat"
      );
      setQty({});
      setShowCart(false);
      router.refresh();
      setTimeout(() => resetSession(), 1200);
    });
  }

  const title =
    setup.mode === "OUT" ? "Merchandise - Out" : "Merchandise - Return";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#E5E7EB] bg-white px-5 py-3 shadow-sm">
        <div className="w-16" />
        <h1 className="text-center text-lg font-semibold tracking-tight text-[#1A1A1A] sm:text-xl">
          {step === "catalog" ? title : "MerchTrack"}
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCart((v) => !v)}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#374151]"
            aria-label="Keranjang"
          >
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#D71920] px-1 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => startTransition(() => logoutTabletAction())}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#374151]"
            aria-label={`Akun ${userName}`}
            title={userName}
          >
            <UserRound size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 sm:px-6">
        {step === "catalog" && (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-[#6B7280]">
              <p>
                Petugas:{" "}
                <span className="font-semibold text-[#1A1A1A]">
                  {setup.nama_petugas}
                </span>
                {setup.mode === "OUT" && selectedTujuan && (
                  <>
                    {" · "}
                    Tujuan:{" "}
                    <span className="font-semibold text-[#1A1A1A]">
                      {selectedTujuan.nama_tujuan}
                    </span>
                  </>
                )}
              </p>
              <button
                type="button"
                onClick={resetSession}
                className="text-xs font-semibold text-[#D71920] hover:underline"
              >
                Ganti mode
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
              {merchandise.map((item) => {
                const value = qty[item.id_merch] ?? 0;
                const disabledOut =
                  setup.mode === "OUT" && item.jumlah_stok <= 0;
                return (
                  <article
                    key={item.id_merch}
                    className="flex flex-col overflow-hidden rounded-2xl border border-[#E8E4DF] bg-white shadow-sm"
                  >
                    <div className="relative aspect-4/3 bg-[#F3F4F6]">
                      {item.foto_path ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.foto_path}
                          alt={item.nama_merch}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[#C4C4C4]">
                          <Package size={36} />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-3">
                      <div>
                        <h2 className="line-clamp-2 text-sm font-semibold leading-snug text-[#1A1A1A]">
                          {item.nama_merch}
                        </h2>
                        <p className="mt-1 text-xs text-[#6B7280]">
                          Stok:{" "}
                          <span className="font-semibold text-[#1A1A1A]">
                            {item.jumlah_stok}
                          </span>
                        </p>
                      </div>
                      <div className="mt-auto flex items-center justify-between gap-2">
                        <button
                          type="button"
                          disabled={value <= 0 || pending}
                          onClick={() =>
                            setItemQty(
                              item.id_merch,
                              value - 1,
                              item.jumlah_stok
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E7EB] text-[#374151] disabled:opacity-40"
                          aria-label="Kurangi"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="min-w-8 text-center text-base font-bold tabular-nums">
                          {value}
                        </span>
                        <button
                          type="button"
                          disabled={disabledOut || pending}
                          onClick={() =>
                            setItemQty(
                              item.id_merch,
                              value + 1,
                              item.jumlah_stok
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D71920] text-white disabled:opacity-40"
                          aria-label="Tambah"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </main>

      {step === "catalog" && (
        <div className="sticky bottom-0 z-20 border-t border-[#E5E7EB] bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <p className="text-sm text-[#6B7280]">
              {cartCount > 0
                ? `${cartCount} pcs dipilih`
                : "Belum ada item dipilih"}
            </p>
            <button
              type="button"
              disabled={pending || cartCount === 0}
              onClick={handleConfirm}
              className="rounded-xl bg-linear-to-r from-[#D71920] to-[#550101] px-6 py-3 text-sm font-semibold text-white shadow disabled:opacity-50"
            >
              {pending ? "Menyimpan..." : "Confirm"}
            </button>
          </div>
          {error && (
            <p className="mx-auto mt-2 max-w-6xl text-sm text-[#B01B1C]">
              {error}
            </p>
          )}
          {success && (
            <p className="mx-auto mt-2 max-w-6xl text-sm text-[#059669]">
              {success}
            </p>
          )}
        </div>
      )}

      {showCart && step === "catalog" && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Keranjang</h3>
              <button
                type="button"
                className="text-sm text-[#6B7280]"
                onClick={() => setShowCart(false)}
              >
                Tutup
              </button>
            </div>
            {cartItems.length === 0 ? (
              <p className="text-sm text-[#6B7280]">Keranjang kosong</p>
            ) : (
              <ul className="max-h-72 space-y-2 overflow-auto">
                {cartItems.map((item) => (
                  <li
                    key={item.id_merch}
                    className="flex items-center justify-between gap-2 rounded-lg border border-[#EFEAE5] px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 truncate font-medium">
                      {item.nama_merch}
                    </span>
                    <span className="shrink-0 tabular-nums text-[#6B7280]">
                      {item.jumlah} pcs
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {step === "mode" && (
        <ModalShell title="Pilih jenis transaksi">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ModeButton
              label="OUT"
              description="Barang keluar dari gudang"
              active={setup.mode === "OUT"}
              onClick={() => setSetup((s) => ({ ...s, mode: "OUT" }))}
            />
            <ModeButton
              label="RETURN"
              description="Kembalikan stok ke gudang"
              active={setup.mode === "RETURN"}
              onClick={() => setSetup((s) => ({ ...s, mode: "RETURN" }))}
            />
          </div>
          <button
            type="button"
            className="mt-5 w-full rounded-xl bg-linear-to-r from-[#D71920] to-[#550101] py-3 text-sm font-semibold text-white"
            onClick={() => setStep("petugas")}
          >
            Lanjut
          </button>
        </ModalShell>
      )}

      {step === "petugas" && (
        <ModalShell
          title={
            setup.mode === "OUT"
              ? "Data petugas & tujuan"
              : "Pilih nama petugas"
          }
        >
          <label className="mb-3 block text-sm">
            <span className="mb-1.5 block font-medium text-[#374151]">
              Nama petugas
            </span>
            {petugasOptions.length > 0 ? (
              <select
                className="h-11 w-full rounded-lg border border-[#D9D9D9] px-3 text-sm outline-none focus:border-[#D71920]"
                value={setup.nama_petugas}
                onChange={(e) =>
                  setSetup((s) => ({ ...s, nama_petugas: e.target.value }))
                }
              >
                <option value="">Pilih petugas</option>
                {petugasOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="h-11 w-full rounded-lg border border-[#D9D9D9] px-3 text-sm outline-none focus:border-[#D71920]"
                value={setup.nama_petugas}
                onChange={(e) =>
                  setSetup((s) => ({ ...s, nama_petugas: e.target.value }))
                }
                placeholder="Ketik nama petugas"
              />
            )}
          </label>

          {setup.mode === "OUT" && (
            <>
              <label className="mb-3 block text-sm">
                <span className="mb-1.5 block font-medium text-[#374151]">
                  Tujuan
                </span>
                <select
                  className="h-11 w-full rounded-lg border border-[#D9D9D9] px-3 text-sm outline-none focus:border-[#D71920]"
                  value={setup.id_tujuan}
                  onChange={(e) =>
                    setSetup((s) => ({
                      ...s,
                      id_tujuan: e.target.value
                        ? Number(e.target.value)
                        : "",
                      id_stasiun: "",
                      id_unit: "",
                      detail_teks: "",
                    }))
                  }
                >
                  <option value="">Pilih tujuan</option>
                  {tujuanList.map((t) => (
                    <option key={t.id_tujuan} value={t.id_tujuan}>
                      {t.nama_tujuan}
                    </option>
                  ))}
                </select>
              </label>

              {selectedTujuan?.jenis_detail === "STASIUN" && (
                <label className="mb-3 block text-sm">
                  <span className="mb-1.5 block font-medium text-[#374151]">
                    {selectedTujuan.label_detail ?? "Stasiun"}
                  </span>
                  <select
                    className="h-11 w-full rounded-lg border border-[#D9D9D9] px-3 text-sm outline-none focus:border-[#D71920]"
                    value={setup.id_stasiun}
                    onChange={(e) =>
                      setSetup((s) => ({
                        ...s,
                        id_stasiun: e.target.value
                          ? Number(e.target.value)
                          : "",
                      }))
                    }
                  >
                    <option value="">Pilih stasiun</option>
                    {stasiunList.map((s) => (
                      <option key={s.id_stasiun} value={s.id_stasiun}>
                        {s.nama_stasiun}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {selectedTujuan?.jenis_detail === "UNIT" && (
                <label className="mb-3 block text-sm">
                  <span className="mb-1.5 block font-medium text-[#374151]">
                    {selectedTujuan.label_detail ?? "Unit"}
                  </span>
                  <select
                    className="h-11 w-full rounded-lg border border-[#D9D9D9] px-3 text-sm outline-none focus:border-[#D71920]"
                    value={setup.id_unit}
                    onChange={(e) =>
                      setSetup((s) => ({
                        ...s,
                        id_unit: e.target.value
                          ? Number(e.target.value)
                          : "",
                      }))
                    }
                  >
                    <option value="">Pilih unit</option>
                    {unitList.map((u) => (
                      <option key={u.id_unit} value={u.id_unit}>
                        {u.nama_unit}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {selectedTujuan?.jenis_detail === "TEKS" && (
                <label className="mb-3 block text-sm">
                  <span className="mb-1.5 block font-medium text-[#374151]">
                    {selectedTujuan.label_detail ?? "Detail"}
                  </span>
                  <input
                    className="h-11 w-full rounded-lg border border-[#D9D9D9] px-3 text-sm outline-none focus:border-[#D71920]"
                    value={setup.detail_teks}
                    onChange={(e) =>
                      setSetup((s) => ({
                        ...s,
                        detail_teks: e.target.value,
                      }))
                    }
                    placeholder="Isi detail tujuan"
                  />
                </label>
              )}
            </>
          )}

          {error && (
            <p className="mb-3 text-sm text-[#B01B1C]">{error}</p>
          )}

          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className="flex-1 rounded-xl border border-[#E5E7EB] py-3 text-sm font-semibold text-[#374151]"
              onClick={() => {
                setError(null);
                setStep("mode");
              }}
            >
              Kembali
            </button>
            <button
              type="button"
              className="flex-1 rounded-xl bg-linear-to-r from-[#D71920] to-[#550101] py-3 text-sm font-semibold text-white"
              onClick={continueFromPetugas}
            >
              Lanjut
            </button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

function ModalShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
        <h2 className="mb-4 text-center text-lg font-semibold text-[#1A1A1A]">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}

function ModeButton({
  label,
  description,
  active,
  onClick,
}: {
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border-2 px-4 py-5 text-left transition ${
        active
          ? "border-[#D71920] bg-[#FFF5F5]"
          : "border-[#E5E7EB] bg-white hover:border-[#F5C2C2]"
      }`}
    >
      <p className="text-xl font-bold tracking-wide text-[#D71920]">{label}</p>
      <p className="mt-1 text-sm text-[#6B7280]">{description}</p>
    </button>
  );
}
