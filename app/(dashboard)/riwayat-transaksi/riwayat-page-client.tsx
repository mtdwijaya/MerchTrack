"use client";

import { useState, useTransition } from "react";
import { FileText } from "lucide-react";

import { generatePreviewAction } from "@/app/(dashboard)/riwayat-transaksi/actions";
import LaporanGeneratePreviewDialog from "@/components/laporan/laporan-generate-preview-dialog";
import RiwayatDetailDialog from "@/components/riwayat-transaksi/riwayat-detail-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DataTable,
  DataTableSection,
  TableEmptyRow,
  Td,
  Th,
} from "@/components/ui/data-table";
import {
  FilterBar,
  FilterDateRange,
  FilterSearch,
  FilterSelect,
} from "@/components/ui/filter-bar";
import PageHeader, { PrimaryButton } from "@/components/ui/page-header";
import Pagination from "@/components/ui/pagination";
import { DetailsAction } from "@/components/ui/table-actions";
import {
  RIWAYAT_JENIS_LABEL,
  RIWAYAT_JENIS_OPTIONS,
} from "@/constants/riwayat-jenis";
import { useListFilters } from "@/hooks/use-list-filters";
import { formatTransaksiDate } from "@/lib/format-transaksi";
import type { LaporanGenerateResult } from "@/lib/laporan-generate";
import type { RiwayatJenis, RiwayatUnifiedItem } from "@/lib/riwayat-transaksi";
import { showError } from "@/lib/toast";

interface Props {
  list: {
    data: RiwayatUnifiedItem[];
    total: number;
    totalPages: number;
  };
  merchandiseList: { id_merch: number; nama_merch: string }[];
  pageSize: number;
}

function JenisBadge({ jenis }: { jenis: RiwayatJenis }) {
  const className =
    jenis === "KELUAR"
      ? "rounded-full border-0 bg-[#FFF5F5] text-[#D32F2F]"
      : jenis === "RESTOCK"
        ? "rounded-full border-0 bg-amber-50 text-amber-700"
        : "rounded-full border-0 bg-emerald-50 text-emerald-700";

  return (
    <Badge variant="secondary" className={className}>
      {RIWAYAT_JENIS_LABEL[jenis]}
    </Badge>
  );
}

function RiwayatTableRow({
  item,
  onDetail,
}: {
  item: RiwayatUnifiedItem;
  onDetail: (jenis: RiwayatJenis, id: number) => void;
}) {
  const lines =
    item.jenis === "KELUAR" && item.items && item.items.length > 0
      ? item.items
      : [
          {
            id: item.id,
            nama_merch: item.merchandise,
            jumlah: item.jumlah,
          },
        ];

  const rowSpan = lines.length;
  const tujuanDisplay =
    item.tujuan ?? (item.jenis === "KELUAR" ? "-" : item.info ?? "-");

  return (
    <>
      {lines.map((line, index) => {
        const isFirst = index === 0;

        return (
          <tr
            key={`${item.key}-${line.id}`}
            className="border-b border-[#E8E4DF] last:border-b-0 hover:bg-[#FAFAF8]/80"
          >
            {isFirst && (
              <Td
                variant="numeric"
                align="left"
                rowSpan={rowSpan}
                className="align-top whitespace-nowrap"
              >
                {formatTransaksiDate(item.tanggal.toISOString())}
              </Td>
            )}

            {isFirst && (
              <Td align="center" rowSpan={rowSpan} className="align-top">
                <JenisBadge jenis={item.jenis} />
              </Td>
            )}

            <Td align="center">
              <p className="truncate font-medium text-[#1A1C1C]">
                {line.nama_merch}
              </p>
            </Td>

            <Td variant="numeric" align="center">
              {line.jumlah.toLocaleString("id-ID")}
            </Td>

            {isFirst && (
              <Td variant="truncate" rowSpan={rowSpan} className="align-top">
                {tujuanDisplay}
              </Td>
            )}

            {isFirst && (
              <Td variant="action" align="center" rowSpan={rowSpan} className="align-top">
                <DetailsAction
                  label="Detail"
                  onClick={() => onDetail(item.jenis, item.id)}
                />
              </Td>
            )}
          </tr>
        );
      })}
    </>
  );
}

export default function RiwayatPageClient({
  list,
  merchandiseList,
  pageSize,
}: Props) {
  const [isPending] = useTransition();
  const {
    search,
    setSearch,
    page,
    setParam,
    setPage,
    resetParams,
    getParam,
  } = useListFilters({});

  const tanggalDari = getParam("tanggal_dari");
  const tanggalSampai = getParam("tanggal_sampai");
  const jenisFilter = getParam("jenis");
  const idMerchFilter = getParam("id_merch");

  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<LaporanGenerateResult | null>(
    null
  );
  const [detail, setDetail] = useState<{
    jenis: RiwayatJenis;
    id: number;
  } | null>(null);

  async function handlePreview() {
    setPreviewLoading(true);
    const result = await generatePreviewAction({
      jenis: jenisFilter || undefined,
      id_merch: idMerchFilter ? Number(idMerchFilter) : null,
      tanggal_dari: tanggalDari || undefined,
      tanggal_sampai: tanggalSampai || undefined,
    });
    setPreviewLoading(false);

    if (!result.ok) {
      showError(result.message);
      return;
    }

    setPreviewData(result.data);
    setPreviewOpen(true);
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Riwayat Transaksi"
          description="Gabungan transaksi barang keluar, barang masuk, dan restock."
          actions={
            <PrimaryButton href="/barang-keluar?modal=tambah">
              Tambah Transaksi
            </PrimaryButton>
          }
        />

        <FilterBar
          onReset={() =>
            resetParams([
              "search",
              "jenis",
              "id_merch",
              "tanggal_dari",
              "tanggal_sampai",
            ])
          }
          headerActions={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={previewLoading}
              onClick={handlePreview}
            >
              <FileText className="h-4 w-4" />
              {previewLoading ? "Memuat..." : "Preview"}
            </Button>
          }
        >
          <FilterSearch
            value={search}
            onChange={setSearch}
            placeholder="ID, nama barang, keterangan..."
          />
          <FilterSelect
            id="filter-jenis-riwayat"
            label="Jenis"
            value={jenisFilter}
            onChange={(value) => setParam("jenis", value)}
            placeholder="Semua jenis"
            options={[...RIWAYAT_JENIS_OPTIONS]}
          />
          <FilterSelect
            id="filter-merch-riwayat"
            label="Merchandise"
            value={idMerchFilter}
            onChange={(value) => setParam("id_merch", value)}
            placeholder="Semua merchandise"
            options={merchandiseList.map((item) => ({
              value: String(item.id_merch),
              label: item.nama_merch,
            }))}
          />
          <FilterDateRange
            id="filter-tanggal-dari"
            label="Dari"
            value={tanggalDari}
            onChange={(value) => setParam("tanggal_dari", value)}
          />
          <FilterDateRange
            id="filter-tanggal-sampai"
            label="Sampai"
            value={tanggalSampai}
            onChange={(value) => setParam("tanggal_sampai", value)}
          />
        </FilterBar>

        <DataTableSection>
          <DataTable>
            <thead>
              <tr className="border-b border-[#E8E4DF] bg-[#FAFAF8]">
                <Th>Tanggal</Th>
                <Th align="center">Jenis</Th>
                <Th align="center">Merchandise</Th>
                <Th align="center">Jumlah</Th>
                <Th>Tujuan</Th>
                <Th align="center">Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {isPending ? (
                <TableEmptyRow colSpan={6} message="Memuat data..." />
              ) : list.data.length === 0 ? (
                <TableEmptyRow colSpan={6} message="Tidak ada transaksi" />
              ) : (
                list.data.map((item) => (
                  <RiwayatTableRow
                    key={item.key}
                    item={item}
                    onDetail={(jenis, id) => setDetail({ jenis, id })}
                  />
                ))
              )}
            </tbody>
          </DataTable>

          {list.total > 0 && (
            <div className="border-t border-[#E8E4DF] px-6 py-4">
              <Pagination
                currentPage={page}
                totalPages={list.totalPages}
                totalItems={list.total}
                pageSize={pageSize}
                itemLabel="transaksi"
                onPageChange={setPage}
              />
            </div>
          )}
        </DataTableSection>
      </div>

      <LaporanGeneratePreviewDialog
        data={previewData}
        open={previewOpen && previewData !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewOpen(false);
        }}
      />

      <RiwayatDetailDialog
        jenis={detail?.jenis ?? null}
        id={detail?.id ?? null}
        open={detail !== null}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      />
    </>
  );
}
