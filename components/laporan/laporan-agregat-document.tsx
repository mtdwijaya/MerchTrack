import { formatTransaksiDate } from "@/lib/format-transaksi";
import type { LaporanGenerateResult } from "@/lib/laporan-generate";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1A1C1C",
  },
  header: {
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#B1070E",
    paddingBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#B1070E",
  },
  subtitle: {
    fontSize: 9,
    color: "#6B7280",
    marginTop: 4,
  },
  metaRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  metaLabel: {
    width: 110,
    color: "#6B7280",
  },
  metaValue: {
    flex: 1,
    fontWeight: "bold",
  },
  summaryBox: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
    marginTop: 10,
  },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 4,
    padding: 8,
  },
  summaryLabel: {
    fontSize: 8,
    color: "#6B7280",
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: "bold",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#FAFAFA",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  colJenis: { width: "10%" },
  colTanggal: { width: "16%" },
  colMerch: { width: "22%" },
  colJumlah: { width: "10%", textAlign: "right" },
  colTujuan: { width: "22%" },
  colPetugas: { width: "20%" },
  th: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#6B7280",
    textTransform: "uppercase",
  },
  td: {
    fontSize: 8,
  },
  empty: {
    padding: 20,
    textAlign: "center",
    color: "#6B7280",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 32,
    right: 32,
    fontSize: 7,
    color: "#9CA3AF",
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 6,
  },
});

export function buildLaporanAgregatFilename(data: LaporanGenerateResult) {
  const stamp = new Date(data.generatedAt)
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");
  return `laporan-merchtrack-${stamp}.pdf`;
}

export function LaporanAgregatDocument({
  data,
}: {
  data: LaporanGenerateResult;
}) {
  return (
    // dokumen hasil generate
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Laporan Merchandise MerchTrack</Text>
          <Text style={styles.subtitle}>
            Digenerate {formatTransaksiDate(data.generatedAt)}
          </Text>
        </View>

        {/* header document */}
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Jenis transaksi</Text>
          <Text style={styles.metaValue}>{data.filters.jenisLabel}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Merchandise</Text>
          <Text style={styles.metaValue}>{data.filters.merchandiseLabel}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Periode</Text>
          <Text style={styles.metaValue}>{data.filters.periodeLabel}</Text>
        </View>

        <View style={styles.summaryBox}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total baris</Text>
            <Text style={styles.summaryValue}>{data.summary.totalRows}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Trx keluar</Text>
            <Text style={styles.summaryValue}>
              {data.summary.totalKeluarTrx}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Pcs keluar (terpakai)</Text>
            <Text style={styles.summaryValue}>
              {data.summary.totalKeluarPcs.toLocaleString("id-ID")}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Trx masuk</Text>
            <Text style={styles.summaryValue}>
              {data.summary.totalMasukTrx}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Pcs masuk</Text>
            <Text style={styles.summaryValue}>
              {data.summary.totalMasukPcs.toLocaleString("id-ID")}
            </Text>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.th, styles.colJenis]}>Jenis</Text>
          <Text style={[styles.th, styles.colTanggal]}>Tanggal</Text>
          <Text style={[styles.th, styles.colMerch]}>Merchandise</Text>
          <Text style={[styles.th, styles.colJumlah]}>Jumlah</Text>
          <Text style={[styles.th, styles.colTujuan]}>Tujuan / Detail</Text>
          <Text style={[styles.th, styles.colPetugas]}>Petugas</Text>
        </View>

        {data.rows.length === 0 ? (
          <Text style={styles.empty}>
            Tidak ada data untuk filter yang dipilih
          </Text>
        ) : (
          data.rows.map((row) => (
            <View key={`${row.jenis}-${row.id}`} style={styles.tableRow} wrap={false}>
              <Text style={[styles.td, styles.colJenis]}>{row.jenis}</Text>
              <Text style={[styles.td, styles.colTanggal]}>
                {formatTransaksiDate(row.tanggal)}
              </Text>
              <Text style={[styles.td, styles.colMerch]}>{row.merchandise}</Text>
              <Text style={[styles.td, styles.colJumlah]}>
                {(row.jenis === "KELUAR" ? row.terpakai ?? row.jumlah : row.jumlah).toLocaleString(
                  "id-ID"
                )}
              </Text>
              <Text style={[styles.td, styles.colTujuan]}>
                {row.jenis === "KELUAR"
                  ? `${row.tujuan ?? ""}${row.detail_tujuan && row.detail_tujuan !== row.tujuan ? ` · ${row.detail_tujuan}` : ""}`
                  : "Restock"}
              </Text>
              <Text style={[styles.td, styles.colPetugas]}>{row.petugas}</Text>
            </View>
          ))
        )}

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `Halaman ${pageNumber} dari ${totalPages} · Digenerate otomatis oleh MerchTrack`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
