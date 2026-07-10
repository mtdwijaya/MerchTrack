import { getBarangKeluarDetail } from "@/app/(dashboard)/barang-keluar/actions";
import { formatTransaksiDate, formatTransaksiId } from "@/lib/format-transaksi";
import { getBarangKeluarQuantities } from "@/lib/barang-keluar-quantities";
import { STATUS_BARANG_KELUAR_LABEL, formatDetailTujuan } from "@/lib/detail-tujuan";
import type { JenisDetailTujuan, StatusBarangKeluar } from "@prisma/client";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

export type LaporanPdfData = NonNullable<
  Awaited<ReturnType<typeof getBarangKeluarDetail>>
>;

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1A1C1C",
  },
  header: {
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: "#B1070E",
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#B1070E",
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

export function LaporanTransaksiDocument({ data }: { data: LaporanPdfData }) {
  const qty = data.qty;
  const statusLabel =
    STATUS_BARANG_KELUAR_LABEL[data.status as StatusBarangKeluar] ??
    data.status;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Laporan Transaksi Barang Keluar</Text>
          <Text style={styles.subtitle}>MerchTrack — LRT Jabodebek</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Transaksi</Text>
          <View style={styles.row}>
            <Text style={styles.label}>ID Transaksi</Text>
            <Text style={styles.value}>
              {formatTransaksiId(data.id_keluar)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tanggal Keluar</Text>
            <Text style={styles.value}>
              {formatTransaksiDate(data.tanggal_keluar)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>{statusLabel}</Text>
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
            <Text style={styles.label}>Barang Keluar</Text>
            <Text style={styles.value}>{qty.keluar} pcs</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Barang Dikembalikan</Text>
            <Text style={styles.value}>{qty.dikembalikan} pcs</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Barang Terpakai</Text>
            <Text style={styles.value}>{qty.terpakai} pcs</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tujuan Distribusi</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Tujuan</Text>
            <Text style={styles.value}>{data.tujuan}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Detail Tujuan</Text>
            <Text style={styles.value}>{data.detail_tujuan}</Text>
          </View>
        </View>

        {data.keterangan ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Keterangan</Text>
            <Text>{data.keterangan}</Text>
          </View>
        ) : null}

        {data.riwayat_kembali.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Riwayat Pengembalian</Text>
            {data.riwayat_kembali.map((item) => (
              <View key={item.id_kembali} style={{ marginBottom: 8 }}>
                <Text>
                  • {item.merchandise ?? "Merchandise"} dikembalikan{" "}
                  {item.jumlah_kembali} pcs —{" "}
                  {formatTransaksiDate(item.tanggal_kembali)} —{" "}
                  {item.pengembali ?? item.petugas}
                  {item.asal ? ` · dari ${item.asal}` : ""}
                </Text>
                {item.keterangan ? (
                  <Text style={{ color: "#6B7280", marginLeft: 8 }}>
                    {item.keterangan}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        <Text style={styles.footer}>
          Dokumen ini digenerate otomatis oleh sistem MerchTrack
        </Text>
      </Page>
    </Document>
  );
}

export function buildLaporanPdfFilename(id: number) {
  return `laporan-${formatTransaksiId(id).replace("#", "")}.pdf`;
}

/** Helper for card display from list row */
export function getLaporanCardSummary(
  jumlah: number,
  jumlahKembali: number
) {
  const qty = getBarangKeluarQuantities(jumlah, jumlahKembali);
  return `${qty.terpakai.toLocaleString("id-ID")} pcs terpakai`;
}

export function getLaporanCardDetailLabel(item: {
  tujuan: { nama_tujuan: string; jenis_detail: JenisDetailTujuan };
  stasiun: { nama_stasiun: string } | null;
  unit: { nama_unit: string } | null;
  detail_teks: string | null;
}) {
  const detail = formatDetailTujuan(item);
  return detail && detail !== "-" ? detail : item.tujuan.nama_tujuan;
}
