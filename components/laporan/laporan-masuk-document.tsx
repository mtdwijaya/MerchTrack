import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import { formatTransaksiDate } from "@/lib/format-transaksi";

export type LaporanMasukPdfData = {
  id_masuk: number;
  tanggal_masuk: string;
  keterangan: string | null;
  jumlah: number;
  merchandise: string;
  petugas: string;
  bukti_path: string | null;
  bukti_nama: string | null;
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1A1A1C",
  },
  header: {
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: "#D32F2F",
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#D32F2F",
  },
  subtitle: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 4,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#374151",
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    marginBottom: 6,
  },
  label: {
    width: 140,
    color: "#6B7280",
  },
  value: {
    flex: 1,
    fontWeight: "bold",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#9CA3AF",
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 8,
  },
});

export function LaporanMasukDocument({ data }: { data: LaporanMasukPdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Laporan Barang Masuk / Restock</Text>
          <Text style={styles.subtitle}>MerchTrack — LRT Jabodebek</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Transaksi</Text>
          <View style={styles.row}>
            <Text style={styles.label}>ID Transaksi</Text>
            <Text style={styles.value}>
              #IN-{String(data.id_masuk).padStart(5, "0")}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tanggal Masuk</Text>
            <Text style={styles.value}>
              {formatTransaksiDate(data.tanggal_masuk)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Dicatat Oleh</Text>
            <Text style={styles.value}>{data.petugas}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Merchandise</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nama Barang</Text>
            <Text style={styles.value}>{data.merchandise}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Jumlah Masuk</Text>
            <Text style={styles.value}>{data.jumlah} pcs</Text>
          </View>
        </View>

        {data.keterangan ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Keterangan</Text>
            <Text>{data.keterangan}</Text>
          </View>
        ) : null}

        {data.bukti_nama ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bukti Dokumen</Text>
            <Text>{data.bukti_nama}</Text>
          </View>
        ) : null}

        <Text style={styles.footer}>
          Dokumen ini digenerate otomatis oleh sistem MerchTrack
        </Text>
      </Page>
    </Document>
  );
}

export function buildLaporanMasukPdfFilename(id: number) {
  return `laporan-masuk-${String(id).padStart(5, "0")}.pdf`;
}
