"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronUp,
  Minus,
  Package,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import type { TujuanOption } from "@/components/barang-keluar/status-badge";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import type { QuickReturnGroup } from "@/lib/barang-kembali";
import {
  confirmQuickOutAction,
  confirmQuickReturnAction,
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
type Step = "mode" | "petugas" | "pilih-transaksi" | "catalog";

type Setup = {
  mode: Mode;
  nama_petugas: string;
  id_tujuan: number | "";
  id_stasiun: number | "";
  id_unit: number | "";
  detail_teks: string;
};

type CartLine = {
  cartKey: number;
  nama_merch: string;
  foto_path: string | null;
  jumlah: number;
  maxQty: number;
  id_merch?: number;
  id_keluar?: number;
};

type Props = {
  userName: string;
  merchandise: CatalogItem[];
  petugasOptions: string[];
  tujuanList: TujuanOption[];
  stasiunList: StasiunOption[];
  unitList: UnitOption[];
  returnGroups: QuickReturnGroup[];
};

function formatTanggalShort(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function QuickAccessClient({
  merchandise,
  petugasOptions,
  tujuanList,
  stasiunList,
  unitList,
  returnGroups,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("mode");
  const [setup, setSetup] = useState<Setup>({
    mode: "OUT",
    nama_petugas: "",
    id_tujuan: "",
    id_stasiun: "",
    id_unit: "",
    detail_teks: "",
  });
  const [selectedReturnKey, setSelectedReturnKey] = useState<string | null>(
    null
  );
  const [qty, setQty] = useState<Record<number, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [showSheet, setShowSheet] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{
    cartKey: number;
    nama_merch: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  const selectedTujuan = useMemo(
    () => tujuanList.find((t) => t.id_tujuan === setup.id_tujuan) ?? null,
    [tujuanList, setup.id_tujuan]
  );

  const selectedReturnGroup = useMemo(
    () =>
      returnGroups.find((group) => group.group_key === selectedReturnKey) ??
      null,
    [returnGroups, selectedReturnKey]
  );

  const catalogLines = useMemo(() => {
    if (setup.mode === "RETURN") {
      return (selectedReturnGroup?.items ?? []).map((item) => ({
        cartKey: item.id_keluar,
        nama_merch: item.nama_merch,
        foto_path: item.foto_path,
        maxQty: item.sisa,
        id_keluar: item.id_keluar as number | undefined,
        id_merch: item.id_merch,
        meta: `Sisa ${item.sisa} pcs`,
      }));
    }

    return merchandise.map((item) => ({
      cartKey: item.id_merch,
      nama_merch: item.nama_merch,
      foto_path: item.foto_path,
      maxQty: item.jumlah_stok,
      id_keluar: undefined as number | undefined,
      id_merch: item.id_merch,
      meta:
        item.jumlah_stok > 0 ? `Stok ${item.jumlah_stok}` : "Stok habis",
    }));
  }, [setup.mode, selectedReturnGroup, merchandise]);

  const cartItems: CartLine[] = useMemo(
    () =>
      catalogLines
        .map((item) => ({
          cartKey: item.cartKey,
          nama_merch: item.nama_merch,
          foto_path: item.foto_path,
          jumlah: qty[item.cartKey] ?? 0,
          maxQty: item.maxQty,
          id_merch: item.id_merch,
          id_keluar: item.id_keluar,
        }))
        .filter((item) => item.jumlah > 0),
    [catalogLines, qty]
  );

  const cartCount = cartItems.reduce((sum, item) => sum + item.jumlah, 0);

  const cartSummaryLabel = useMemo(() => {
    if (cartItems.length === 0) return "Belum ada pilihan";
    const preview = cartItems
      .slice(0, 2)
      .map((item) => `${item.nama_merch} : ${item.jumlah} pcs`)
      .join(", ");
    return cartItems.length > 2 ? `${preview}, dll` : preview;
  }, [cartItems]);

  function setItemQty(cartKey: number, next: number, maxQty: number) {
    const capped = Math.max(0, Math.min(next, maxQty));
    setQty((prev) => {
      if (capped <= 0) {
        const { [cartKey]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [cartKey]: capped };
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
    setSelectedReturnKey(null);
    setStep("mode");
    setError(null);
    setShowSheet(false);
    setShowSuccess(false);
    setShowResetConfirm(false);
    setRemoveTarget(null);
  }

  function requestResetSession() {
    setShowResetConfirm(true);
  }

  function requestRemoveItem(item: { cartKey: number; nama_merch: string }) {
    setRemoveTarget(item);
  }

  function confirmRemoveItem() {
    if (!removeTarget) return;
    setQty((prev) => {
      const { [removeTarget.cartKey]: _, ...rest } = prev;
      return rest;
    });
    setRemoveTarget(null);
  }

  function backFromCatalog() {
    setError(null);
    setShowSheet(false);
    setQty({});
    if (setup.mode === "RETURN") {
      setSelectedReturnKey(null);
      setStep("pilih-transaksi");
      return;
    }
    setStep("petugas");
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
      setStep("catalog");
      return;
    }

    setSelectedReturnKey(null);
    setQty({});
    setStep("pilih-transaksi");
  }

  function selectReturnGroup(group: QuickReturnGroup) {
    setSelectedReturnKey(group.group_key);
    setQty({});
    setError(null);
    setStep("catalog");
  }

  function handleConfirm() {
    setError(null);
    if (cartItems.length === 0) {
      setError("Pilih minimal 1 merchandise");
      return;
    }

    startTransition(async () => {
      const result =
        setup.mode === "OUT"
          ? await confirmQuickOutAction({
              nama_petugas: setup.nama_petugas,
              id_tujuan: setup.id_tujuan,
              id_stasiun: setup.id_stasiun || null,
              id_unit: setup.id_unit || null,
              detail_teks: setup.detail_teks || null,
              items: cartItems.map((item) => ({
                id_merch: item.id_merch!,
                jumlah: item.jumlah,
              })),
            })
          : await confirmQuickReturnAction({
              pengembali: setup.nama_petugas,
              asal: selectedReturnGroup?.asal ?? "Akses cepat",
              items: cartItems.map((item) => ({
                id_keluar: item.id_keluar!,
                jumlah_kembali: item.jumlah,
              })),
            });

      if (!result.ok) {
        setError(result.message);
        setShowSheet(false);
        return;
      }

      setQty({});
      setShowSheet(false);
      setShowSuccess(true);
      router.refresh();
    });
  }

  const title =
    setup.mode === "OUT" ? "Merchandise - OUT" : "Merchandise - RETURN";

  const subtitleExtra =
    setup.mode === "OUT" && selectedTujuan
      ? ` · ${selectedTujuan.nama_tujuan}`
      : setup.mode === "RETURN" && selectedReturnGroup
        ? ` · ${selectedReturnGroup.tujuan}`
        : "";

  return (
    <div className="relative mx-auto flex h-dvh min-h-dvh w-full max-w-[1340px] flex-col overflow-hidden bg-linear-to-br from-[#8A000B] via-[#550101] to-[#240003] xl:max-w-[1440px]">
      {step === "pilih-transaksi" && (
        <>
          <header className="relative shrink-0 px-4 pb-1.5 pt-4 sm:px-5 sm:pt-5 md:px-6 lg:px-8 lg:pt-6">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setStep("petugas");
              }}
              className="absolute left-3 top-4 flex size-9 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition hover:bg-white/20 sm:left-4 sm:top-5 sm:size-10"
              aria-label="Kembali"
            >
              <ArrowLeft className="size-5" strokeWidth={2.5} />
            </button>
            <h1 className="text-center text-lg font-bold tracking-tight text-white sm:text-xl md:text-[22px]">
              Pilih transaksi
            </h1>
            <p className="mt-1 text-center text-[11px] text-white/70 sm:text-xs">
              {setup.nama_petugas}
              {" · "}
              <button
                type="button"
                onClick={requestResetSession}
                className="font-semibold text-[#FEE9E9] underline-offset-2 hover:underline"
              >
                Ganti mode
              </button>
            </p>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-3 sm:px-6 lg:px-8">
            {returnGroups.length === 0 ? (
              <div className="rounded-2xl border border-white/15 bg-black/30 px-5 py-10 text-center">
                <p className="text-sm font-medium text-white">
                  Tidak ada transaksi yang bisa dikembalikan
                </p>
                <p className="mt-2 text-xs text-white/65">
                  Hanya transaksi dengan tujuan yang mengizinkan return dan
                  masih memiliki sisa barang.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {returnGroups.map((group) => (
                  <li key={group.group_key}>
                    <button
                      type="button"
                      onClick={() => selectReturnGroup(group)}
                      className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-4 text-left transition hover:border-white/30 hover:bg-black/55 sm:px-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white sm:text-base">
                            #{group.id_keluar} · {group.tujuan}
                          </p>
                          <p className="mt-1 truncate text-xs text-white/70 sm:text-sm">
                            {group.merchandise_label}
                          </p>
                          <p className="mt-1 text-[11px] text-white/55 sm:text-xs">
                            {formatTanggalShort(group.tanggal_keluar)}
                            {group.detail_tujuan &&
                            group.detail_tujuan !== "-"
                              ? ` · ${group.detail_tujuan}`
                              : ""}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-white/15 px-3 py-1 text-xs font-bold tabular-nums text-white">
                          {group.total_sisa} pcs
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </main>
        </>
      )}

      {step === "catalog" && (
        <>
          <header className="relative shrink-0 px-4 pb-1.5 pt-4 sm:px-5 sm:pt-5 md:px-6 lg:px-8 lg:pt-6 max-[850px]:pt-3.5">
            <button
              type="button"
              onClick={backFromCatalog}
              className="absolute left-3 top-4 flex size-9 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition hover:bg-white/20 sm:left-4 sm:top-5 sm:size-10 md:left-5 lg:left-6 lg:size-11 max-[850px]:top-3.5"
              aria-label="Kembali"
            >
              <ArrowLeft className="size-5 lg:size-6" strokeWidth={2.5} />
            </button>
            <h1 className="text-center text-lg font-bold tracking-tight text-white sm:text-xl md:text-[22px] lg:text-[26px] max-[850px]:text-[20px]">
              {title}
            </h1>
            <p className="mt-1 text-center text-[11px] text-white/70 sm:mt-1.5 sm:text-xs lg:text-sm">
              {setup.nama_petugas}
              {subtitleExtra}
              {" · "}
              <button
                type="button"
                onClick={requestResetSession}
                className="font-semibold text-[#FEE9E9] underline-offset-2 hover:underline"
              >
                Ganti mode
              </button>
            </p>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto px-3 pb-24 pt-2 sm:px-5 sm:pt-3 md:px-6 lg:px-8 lg:pb-28 lg:pt-4 max-[850px]:pb-20">
            {setup.mode === "RETURN" && selectedReturnGroup && (
              <div className="mb-3 rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-xs text-white/75 sm:mb-4 sm:px-4 sm:text-sm">
                Transaksi #{selectedReturnGroup.id_keluar} ·{" "}
                {selectedReturnGroup.tujuan}
                {selectedReturnGroup.detail_tujuan !== "-"
                  ? ` · ${selectedReturnGroup.detail_tujuan}`
                  : ""}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3 md:gap-3.5 lg:gap-x-4 lg:gap-y-4 max-[850px]:gap-2.5">
              {catalogLines.map((item) => {
                const value = qty[item.cartKey] ?? 0;
                const canAdd = value < item.maxQty;
                const disabledOut = setup.mode === "OUT" && item.maxQty <= 0;
                return (
                  <article
                    key={item.cartKey}
                    className="flex flex-col rounded-[10px] bg-black/50 px-[9%] pb-2 pt-[6%] shadow-[0_5px_14px_rgba(255,255,255,0.22)] sm:aspect-[158/178] lg:rounded-xl lg:aspect-[158/185] lg:px-[10%] lg:pb-2.5 lg:pt-[7%] max-[850px]:aspect-[158/168] max-[850px]:px-[8%] max-[850px]:pb-1.5 max-[850px]:pt-[5%]"
                  >
                    <div className="mx-auto aspect-square w-full overflow-hidden rounded-[8px] bg-[#989898] lg:rounded-[10px]">
                      {item.foto_path ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.foto_path}
                          alt={item.nama_merch}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-white/50">
                          <Package className="size-6 sm:size-7 lg:size-8" />
                        </div>
                      )}
                    </div>

                    <h2 className="mt-1.5 line-clamp-2 min-h-8 text-center text-[10px] font-medium leading-snug text-white sm:mt-2 sm:min-h-9 sm:text-[11px] lg:text-xs max-[850px]:mt-1 max-[850px]:min-h-7 max-[850px]:text-[10px]">
                      {item.nama_merch}
                    </h2>
                    <p className="text-center text-[9px] text-white/55 sm:text-[10px]">
                      {item.meta}
                    </p>

                    <div className="mt-auto flex items-center justify-center gap-1.5 pt-1 sm:gap-2 md:gap-2.5 lg:gap-3">
                      <button
                        type="button"
                        disabled={value <= 0 || pending}
                        onClick={() =>
                          setItemQty(item.cartKey, value - 1, item.maxQty)
                        }
                        className="flex size-7 items-center justify-center rounded-full text-white disabled:opacity-30 lg:size-8"
                        aria-label="Kurangi"
                      >
                        <Minus
                          className="size-5 lg:size-6"
                          strokeWidth={2.5}
                        />
                      </button>

                      <div className="flex h-6 min-w-9 items-center justify-center rounded-full bg-[#9C9B9B] px-2 text-[11px] font-semibold tabular-nums text-white sm:min-w-10 md:min-w-11 lg:h-7 lg:min-w-12 lg:text-xs">
                        {value}
                      </div>

                      <button
                        type="button"
                        disabled={disabledOut || !canAdd || pending}
                        onClick={() =>
                          setItemQty(item.cartKey, value + 1, item.maxQty)
                        }
                        className="flex size-7 items-center justify-center rounded-full text-white disabled:opacity-30 lg:size-8"
                        aria-label="Tambah"
                      >
                        <Plus className="size-5 lg:size-6" strokeWidth={2.5} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {error && (
              <p className="mt-4 text-center text-sm font-medium text-[#FEE9E9]">
                {error}
              </p>
            )}
          </main>

          <div className="fixed inset-x-0 bottom-0 z-40">
            {showSheet && (
              <button
                type="button"
                className="absolute inset-x-0 bottom-full h-screen bg-black/45"
                aria-label="Tutup sheet"
                onClick={() => setShowSheet(false)}
              />
            )}

            <div
              className={`relative w-full border-t border-black/20 bg-linear-to-b from-[#88000A] to-[#240003] shadow-[0_-8px_28px_rgba(0,0,0,0.35)] ${
                showSheet ? "rounded-t-3xl" : ""
              }`}
            >
              {!showSheet ? (
                <div className="relative mx-auto w-full max-w-[1340px] xl:max-w-[1440px]">
                  <button
                    type="button"
                    onClick={() => setShowSheet(true)}
                    className="absolute left-5 top-0 z-10 flex h-8 w-12 -translate-y-full items-center justify-center rounded-t-[22px] border border-b-0 border-black/25 bg-linear-to-b from-[#88000A] to-[#6E0008] text-[#FEE9E9] sm:left-6 md:left-8 md:h-[33px] md:w-14"
                    aria-label="Lihat detail pilihan"
                  >
                    <ChevronUp
                      className="size-5 lg:size-6"
                      strokeWidth={2.75}
                    />
                  </button>
                  <div className="flex h-12 items-center justify-between gap-3 px-4 sm:h-14 sm:px-5 md:px-6 lg:h-14 lg:px-8 max-[850px]:h-12">
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-white/80 lg:text-base">
                      {cartSummaryLabel}
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowSheet(true)}
                      className="rounded-[8px] border border-[#FEE9E9]/70 px-4 py-2 text-[11px] font-semibold text-[#FEE9E9] transition hover:bg-white/10 lg:px-5 lg:text-sm"
                    >
                      Detail
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mx-auto flex w-full max-w-[1340px] max-h-[min(62dvh,520px)] flex-col max-[850px]:max-h-[min(58dvh,460px)]">
                  <div className="flex shrink-0 justify-center pt-2">
                    <button
                      type="button"
                      onClick={() => setShowSheet(false)}
                      className="flex flex-col items-center gap-1.5 px-6"
                      aria-label="Tutup sheet"
                    >
                      <div className="h-1.5 w-12 rounded-full bg-white/35" />
                      <ChevronUp className="size-5 rotate-180 text-white/70" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between px-4 pb-2 pt-1 sm:px-5 md:px-6 lg:px-8">
                    <h3 className="text-base font-semibold text-white lg:text-lg">
                      Detail pilihan
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowSheet(false)}
                      className="rounded-full p-1.5 text-white/80 hover:bg-white/10"
                      aria-label="Tutup"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto px-4 sm:px-5 md:px-6 lg:px-8">
                    {cartItems.length === 0 ? (
                      <p className="py-8 text-center text-sm text-white/65">
                        Belum ada merchandise dipilih
                      </p>
                    ) : (
                      <ul className="divide-y divide-white/15">
                        {cartItems.map((item) => {
                          const canAdd = item.jumlah < item.maxQty;
                          return (
                            <li
                              key={item.cartKey}
                              className="flex items-center gap-2.5 py-3 sm:gap-3"
                            >
                              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-[#989898] sm:h-12 sm:w-12 lg:h-14 lg:w-14">
                                {item.foto_path ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={item.foto_path}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center text-white/50">
                                    <Package size={20} />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-white lg:text-base">
                                  {item.nama_merch}
                                </p>
                                <p className="text-xs text-white/60">
                                  Quantity · max {item.maxQty}
                                </p>
                              </div>

                              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                                <button
                                  type="button"
                                  disabled={pending || item.jumlah <= 1}
                                  onClick={() =>
                                    setItemQty(
                                      item.cartKey,
                                      item.jumlah - 1,
                                      item.maxQty
                                    )
                                  }
                                  className="flex size-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-30"
                                  aria-label="Kurangi quantity"
                                >
                                  <Minus size={16} strokeWidth={2.5} />
                                </button>
                                <span className="min-w-8 text-center text-sm font-bold tabular-nums text-white">
                                  {item.jumlah}
                                </span>
                                <button
                                  type="button"
                                  disabled={pending || !canAdd}
                                  onClick={() =>
                                    setItemQty(
                                      item.cartKey,
                                      item.jumlah + 1,
                                      item.maxQty
                                    )
                                  }
                                  className="flex size-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-30"
                                  aria-label="Tambah quantity"
                                >
                                  <Plus size={16} strokeWidth={2.5} />
                                </button>
                                <button
                                  type="button"
                                  disabled={pending}
                                  onClick={() =>
                                    requestRemoveItem({
                                      cartKey: item.cartKey,
                                      nama_merch: item.nama_merch,
                                    })
                                  }
                                  className="ml-0.5 flex size-8 items-center justify-center rounded-full bg-white/10 text-[#FEE9E9] transition hover:bg-white/20 disabled:opacity-30"
                                  aria-label={`Hapus ${item.nama_merch}`}
                                >
                                  <Trash2 size={15} strokeWidth={2.25} />
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  <div className="mx-auto w-full max-w-[1340px] shrink-0 border-t border-white/15 px-4 py-3.5 sm:px-5 sm:py-4 md:px-6 lg:px-8">
                    <div className="mb-3 flex items-center justify-between text-sm font-semibold text-white lg:text-base">
                      <span>Total</span>
                      <span>{cartCount} pcs</span>
                    </div>
                    <button
                      type="button"
                      disabled={pending || cartCount === 0}
                      onClick={handleConfirm}
                      className="w-full rounded-[10px] bg-[#FEE9E9] py-3 text-sm font-bold tracking-wide text-[#8A000B] shadow-[0_2px_10px_rgba(0,0,0,0.35)] transition hover:bg-white disabled:bg-[#FEE9E9]/40 disabled:text-[#8A000B]/50 disabled:shadow-none sm:py-3.5 lg:py-4 lg:text-base"
                    >
                      {pending ? "Menyimpan..." : "Confirm"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#ECFDF5] text-[#059669]">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-lg font-semibold text-[#1A1A1A]">Berhasil</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#4B5563]">
              {setup.mode === "OUT"
                ? "Pengambilan barang berhasil. Transaksi tercatat sebagai barang keluar."
                : "Pengembalian berhasil tercatat ke transaksi keluar yang dipilih. Stok gudang sudah diperbarui."}
            </p>
            <button
              type="button"
              className="mt-5 w-full rounded-xl bg-linear-to-r from-[#D71920] to-[#550101] py-3 text-sm font-semibold text-white"
              onClick={resetSession}
            >
              Selesai
            </button>
          </div>
        </div>
      )}

      {step === "mode" && (
        <ModalShell title="Pilih jenis transaksi">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ModeButton
              label="OUT"
              description="Catat barang keluar"
              active={setup.mode === "OUT"}
              onClick={() => setSetup((s) => ({ ...s, mode: "OUT" }))}
            />
            <ModeButton
              label="RETURN"
              description="Kembalikan dari transaksi keluar"
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
              {tujuanList.length === 0 && (
                <p className="mb-3 text-xs text-[#B01B1C]">
                  Belum ada data tujuan. Tambahkan tujuan di halaman admin
                  terlebih dahulu.
                </p>
              )}

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
            </>
          )}

          {error && <p className="mb-3 text-sm text-[#B01B1C]">{error}</p>}

          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#E5E7EB] py-3 text-sm font-semibold text-[#374151]"
              onClick={() => {
                setError(null);
                setStep("mode");
              }}
            >
              Back
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

      <ConfirmDialog
        open={showResetConfirm}
        title="Ganti mode?"
        message="Semua pilihan merchandise dan data input akan hilang. Lanjutkan ganti mode?"
        confirmLabel="Ya, ganti mode"
        onConfirm={resetSession}
        onCancel={() => setShowResetConfirm(false)}
      />

      <ConfirmDialog
        open={removeTarget !== null}
        title="Hapus merchandise?"
        message={
          removeTarget
            ? `"${removeTarget.nama_merch}" akan dihapus dari pilihan. Lanjutkan?`
            : ""
        }
        confirmLabel="Ya, hapus"
        onConfirm={confirmRemoveItem}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  );
}

function ModalShell({
  title,
  children,
  onBack,
}: {
  title: string;
  children: React.ReactNode;
  onBack?: () => void;
}) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/35 p-4 sm:p-6">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-6 lg:max-w-xl lg:p-7">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="absolute left-4 top-4 flex size-9 items-center justify-center rounded-full border border-[#E5E7EB] text-[#374151] transition hover:bg-[#F3F4F6] sm:left-5 sm:top-5"
            aria-label="Kembali"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
        )}
        <h2 className="mb-4 text-center text-lg font-semibold text-[#1A1A1A] lg:text-xl">
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
