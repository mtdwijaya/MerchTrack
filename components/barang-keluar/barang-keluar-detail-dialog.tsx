"use client";

import type { StatusBarangKeluar } from "@prisma/client";
import {
  Calendar,
  FileText,
  Package,
  RotateCcw,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";

import StatusBarangKeluarBadge from "@/components/barang-keluar/status-badge";
import BuktiDocumentPreview from "@/components/ui/bukti-document-preview";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatTransaksiDate, formatTransaksiId } from "@/lib/format-transaksi";
import { getBarangKeluarDetail } from "@/app/admin/(dashboard)/barang-keluar/actions";

export type BarangKeluarDetailData = NonNullable<
  Awaited<ReturnType<typeof getBarangKeluarDetail>>
>;

interface BarangKeluarDetailDialogProps {
  id: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReturn?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
        {title}
      </h3>
      <dl className="mt-4 space-y-3">{children}</dl>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-[#6B7280]">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-[#1A1C1C]">{value}</dd>
    </div>
  );
}

export default function BarangKeluarDetailDialog({
  id,
  open,
  onOpenChange,
  onReturn,
  onEdit,
  onDelete,
}: BarangKeluarDetailDialogProps) {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<BarangKeluarDetailData | null>(null);
  const canReturn = Boolean(onReturn && detail?.boleh_return);

  useEffect(() => {
    if (!open || !id) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getBarangKeluarDetail(id).then((data) => {
      if (!cancelled) {
        setDetail(data);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [open, id]);

  const totalKeluar = detail?.grup_items.reduce(
    (sum, item) => sum + item.qty.keluar,
    0
  );
  const totalKembali = detail?.grup_items.reduce(
    (sum, item) => sum + item.qty.dikembalikan,
    0
  );
  const totalTerpakai = detail?.grup_items.reduce(
    (sum, item) => sum + item.qty.terpakai,
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto border border-[#E5E7EB] p-0 shadow-xl sm:max-w-3xl"
        showCloseButton
      >
        {loading || !detail ? (
          <div className="px-6 py-16 text-center text-sm text-[#6B7280]">
            {loading ? "Memuat detail transaksi..." : "Data tidak ditemukan"}
          </div>
        ) : (
          <>
            <div className="border-b border-[#EFEAE5] px-6 py-5">
              <div className="mr-4 mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF2F2]">
                    <Package className="h-5 w-5 text-[#B1070E]" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-semibold text-[#1A1C1C]">
                      {detail.is_multi
                        ? "Detail Transaksi Barang"
                        : `Detail Barang Keluar — ${detail.merchandise}`}
                    </DialogTitle>
                    <p className="mt-1 text-sm text-[#6B7280]">
                      {detail.is_multi
                        ? `${detail.grup_items.length} merchandise · ${formatTransaksiId(detail.id_keluar)}`
                        : formatTransaksiId(detail.id_keluar)}
                    </p>
                  </div>
                </div>
                <StatusBarangKeluarBadge
                  status={detail.status as StatusBarangKeluar}
                />
              </div>
            </div>

            <div className="space-y-6 px-6 py-6">
              <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                    Daftar Merchandise
                  </h3>
                  {canReturn &&
                    detail.grup_items.some((item) => item.sisa_return > 0) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onReturn?.(detail.id_keluar);
                          onOpenChange(false);
                        }}
                      >
                        <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                        Kembalikan
                      </Button>
                    )}
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#EFEAE5] text-left text-xs text-[#6B7280]">
                        <th className="pb-2 pr-4 font-medium">Merchandise</th>
                        <th className="pb-2 pr-4 font-medium">Keluar</th>
                        <th className="pb-2 pr-4 font-medium">Kembali</th>
                        <th className="pb-2 pr-4 font-medium">Terpakai</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.grup_items.map((item) => (
                        <tr
                          key={item.id_keluar}
                          className="border-b border-[#F3F4F6] last:border-b-0"
                        >
                          <td className="py-2.5 pr-4 font-medium text-[#1A1C1C]">
                            {item.merchandise}
                          </td>
                          <td className="py-2.5 pr-4 text-[#4B5563]">
                            {item.qty.keluar.toLocaleString("id-ID")} pcs
                          </td>
                          <td className="py-2.5 pr-4 text-[#4B5563]">
                            {item.qty.dikembalikan.toLocaleString("id-ID")} pcs
                          </td>
                          <td className="py-2.5 pr-4 text-[#4B5563]">
                            {item.qty.terpakai.toLocaleString("id-ID")} pcs
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <InfoCard title="Informasi Tujuan">
                  <InfoRow label="Tujuan" value={detail.tujuan} />
                  <InfoRow label="Detail Tujuan" value={detail.detail_tujuan} />
                  <InfoRow
                    label="Tanggal Keluar"
                    value={
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-[#6B7280]" />
                        {formatTransaksiDate(detail.tanggal_keluar)}
                      </span>
                    }
                  />
                  {detail.is_multi && (
                    <>
                      <InfoRow
                        label="Total Barang Keluar"
                        value={`${(totalKeluar ?? 0).toLocaleString("id-ID")} pcs`}
                      />
                      <InfoRow
                        label="Total Terpakai"
                        value={`${(totalTerpakai ?? 0).toLocaleString("id-ID")} pcs`}
                      />
                    </>
                  )}
                </InfoCard>

                <InfoCard title="Informasi Petugas">
                  <InfoRow
                    label="Nama Petugas"
                    value={
                      <span className="inline-flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-[#6B7280]" />
                        {detail.petugas}
                      </span>
                    }
                  />
                  <InfoRow
                    label="Total Pengembalian"
                    value={`${detail.riwayat_kembali.length} kali`}
                  />
                  {!detail.is_multi && (
                    <>
                      <InfoRow
                        label="Barang Dikembalikan"
                        value={`${(totalKembali ?? 0).toLocaleString("id-ID")} pcs`}
                      />
                      <InfoRow
                        label="Sisa Bisa Dikembalikan"
                        value={`${detail.sisa_return.toLocaleString("id-ID")} pcs`}
                      />
                    </>
                  )}
                  {detail.is_multi && (
                    <InfoRow
                      label="Total Dikembalikan"
                      value={`${(totalKembali ?? 0).toLocaleString("id-ID")} pcs`}
                    />
                  )}
                </InfoCard>
              </div>

              {detail.keterangan && (
                <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#1A1C1C]">
                    <FileText className="h-4 w-4 text-[#6B7280]" />
                    Keterangan
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-[#4B5563]">
                    {detail.keterangan}
                  </p>
                </div>
              )}

              {detail.bukti_path && detail.bukti_nama && (
                <BuktiDocumentPreview
                  path={detail.bukti_path}
                  name={detail.bukti_nama}
                />
              )}

              <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#1A1C1C]">
                  <RotateCcw className="h-4 w-4 text-[#6B7280]" />
                  Riwayat Pengembalian
                </div>

                {detail.riwayat_kembali.length === 0 ? (
                  <p className="mt-3 text-sm text-[#6B7280]">
                    Belum ada pengembalian untuk transaksi ini.
                  </p>
                ) : (
                  <div className="mt-4 space-y-0">
                    {detail.riwayat_kembali.map((item, index) => (
                      <div key={item.id_kembali} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF5F5] text-[#D32F2F]">
                            <RotateCcw className="h-3.5 w-3.5" />
                          </div>
                          {index < detail.riwayat_kembali.length - 1 && (
                            <div className="my-1 w-px flex-1 bg-[#E5E7EB]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 pb-5">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm font-medium text-[#1A1C1C]">
                              {item.merchandise} dikembalikan{" "}
                              {item.jumlah_kembali.toLocaleString("id-ID")} pcs
                            </p>
                            <p className="text-xs text-[#6B7280]">
                              {formatTransaksiDate(item.tanggal_kembali)}
                            </p>
                          </div>
                          <p className="mt-0.5 text-xs text-[#6B7280]">
                            oleh {item.pengembali ?? item.petugas}
                            {item.asal ? ` · dari ${item.asal}` : ""}
                          </p>
                          {item.keterangan && (
                            <p className="mt-1.5 text-sm text-[#4B5563]">
                              {item.keterangan}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-[#E8E4DF] bg-[#FAFAF8] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {onEdit && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      onOpenChange(false);
                      onEdit(detail.id_keluar);
                    }}
                  >
                    Edit Transaksi
                  </Button>
                )}
                {onDelete && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      onOpenChange(false);
                      onDelete(detail.id_keluar);
                    }}
                  >
                    Hapus Transaksi
                  </Button>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Tutup
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
