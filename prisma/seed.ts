import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(10, 0, 0, 0);
  return date;
}

async function main() {
  console.log("🌱 Reset & seed database...");

  await prisma.$executeRaw`DELETE FROM "AktivitasLog"`;
  await prisma.barangKembali.deleteMany();
  await prisma.barangKeluar.deleteMany();
  await prisma.barangMasuk.deleteMany();

  const hashedPassword = await bcrypt.hash("password123", 10);

  const tujuanEvent = await prisma.tujuan.upsert({
    where: { nama_tujuan: "Event" },
    update: {
      jenis_detail: "TEKS",
      label_detail: "Nama Keterangan Event",
      boleh_return: true,
    },
    create: {
      nama_tujuan: "Event",
      jenis_detail: "TEKS",
      label_detail: "Nama Keterangan Event",
      boleh_return: true,
    },
  });

  const tujuanUnit = await prisma.tujuan.upsert({
    where: { nama_tujuan: "Dibagikan ke Unit Lain" },
    update: {
      jenis_detail: "UNIT",
      label_detail: "Pilih Unit",
      boleh_return: false,
    },
    create: {
      nama_tujuan: "Dibagikan ke Unit Lain",
      jenis_detail: "UNIT",
      label_detail: "Pilih Unit",
      boleh_return: false,
    },
  });

  await prisma.tujuan.upsert({
    where: { nama_tujuan: "Dibagikan ke Penumpang" },
    update: {
      jenis_detail: "TIDAK_ADA",
      boleh_return: false,
    },
    create: {
      nama_tujuan: "Dibagikan ke Penumpang",
      jenis_detail: "TIDAK_ADA",
      boleh_return: false,
    },
  });

  const tujuanLainnya = await prisma.tujuan.upsert({
    where: { nama_tujuan: "Lainnya" },
    update: {
      jenis_detail: "TEKS",
      label_detail: "Keterangan",
      boleh_return: true,
    },
    create: {
      nama_tujuan: "Lainnya",
      jenis_detail: "TEKS",
      label_detail: "Keterangan",
      boleh_return: true,
    },
  });

  const tujuanStasiun = await prisma.tujuan.upsert({
    where: { nama_tujuan: "Stasiun" },
    update: {
      jenis_detail: "STASIUN",
      label_detail: "Pilih Stasiun",
      boleh_return: false,
    },
    create: {
      nama_tujuan: "Stasiun",
      jenis_detail: "STASIUN",
      label_detail: "Pilih Stasiun",
      boleh_return: false,
    },
  });

  const unitHumas = await prisma.unit.upsert({
    where: { kode_unit: "UNT-003" },
    update: {},
    create: {
      kode_unit: "UNT-003",
      nama_unit: "Unit Humas",
    },
  });

  const stasiunCawang = await prisma.stasiun.upsert({
    where: { kode_stasiun: "STN-003" },
    update: {},
    create: {
      kode_stasiun: "STN-003",
      nama_stasiun: "Cawang",
      alamat: "Jakarta Timur",
      kontak: "(021)100003",
    },
  });

  const tumbler = await prisma.merchandise.upsert({
    where: { nama_normalized: "tumbler stainless lrt" },
    update: {},
    create: {
      nama_merch: "Tumbler Stainless LRT",
      nama_normalized: "tumbler stainless lrt",
      deskripsi: "Tumbler official LRT Jabodebek",
    },
  });

  const bantal = await prisma.merchandise.upsert({
    where: { nama_normalized: "bantal leher lrt" },
    update: {},
    create: {
      nama_merch: "Bantal Leher LRT",
      nama_normalized: "bantal leher lrt",
      deskripsi: "Bantal perjalanan penumpang",
    },
  });

  const totebag = await prisma.merchandise.upsert({
    where: { nama_normalized: "totebag kanvas lrt" },
    update: {},
    create: {
      nama_merch: "Totebag Kanvas LRT",
      nama_normalized: "totebag kanvas lrt",
      deskripsi: "Totebag resmi LRT",
    },
  });

  await prisma.stok.upsert({
    where: { id_merch: tumbler.id_merch },
    update: { jumlah_stok: 0 },
    create: { id_merch: tumbler.id_merch, jumlah_stok: 0 },
  });

  await prisma.stok.upsert({
    where: { id_merch: bantal.id_merch },
    update: { jumlah_stok: 0 },
    create: { id_merch: bantal.id_merch, jumlah_stok: 0 },
  });

  await prisma.stok.upsert({
    where: { id_merch: totebag.id_merch },
    update: { jumlah_stok: 0 },
    create: { id_merch: totebag.id_merch, jumlah_stok: 0 },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@lrt.co.id" },
    update: {},
    create: {
      nama_user: "Administrator",
      email: "admin@lrt.co.id",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  const petugas = await prisma.user.upsert({
    where: { email: "petugas@lrt.co.id" },
    update: {},
    create: {
      nama_user: "Petugas Gudang",
      email: "petugas@lrt.co.id",
      password: hashedPassword,
      role: "PETUGAS",
    },
  });

  const masukData = [
    {
      id_merch: tumbler.id_merch,
      jumlah: 200,
      tanggal: daysAgo(25),
      keterangan: "Restock awal tumbler",
    },
    {
      id_merch: bantal.id_merch,
      jumlah: 100,
      tanggal: daysAgo(20),
      keterangan: "Restock bantal leher",
    },
    {
      id_merch: totebag.id_merch,
      jumlah: 150,
      tanggal: daysAgo(10),
      keterangan: "Restock totebag kanvas",
    },
    {
      id_merch: tumbler.id_merch,
      jumlah: 50,
      tanggal: daysAgo(3),
      keterangan: "Restock tambahan tumbler",
    },
  ];

  for (const item of masukData) {
    await prisma.barangMasuk.create({
      data: {
        id_merch: item.id_merch,
        id_user: petugas.id_user,
        jumlah: item.jumlah,
        tanggal_masuk: item.tanggal,
        keterangan: item.keterangan,
      },
    });

    await prisma.stok.update({
      where: { id_merch: item.id_merch },
      data: { jumlah_stok: { increment: item.jumlah } },
    });
  }

  const keluarData = [
    {
      id_merch: tumbler.id_merch,
      id_tujuan: tujuanEvent.id_tujuan,
      detail_teks: "Event Hari Angkutan Umum",
      jumlah: 30,
      jumlah_kembali: 5,
      tanggal: daysAgo(18),
      keterangan: "Distribusi event publik",
    },
    {
      id_merch: bantal.id_merch,
      id_tujuan: tujuanStasiun.id_tujuan,
      id_stasiun: stasiunCawang.id_stasiun,
      jumlah: 20,
      jumlah_kembali: 0,
      tanggal: daysAgo(14),
      keterangan: "Display stasiun Cawang",
    },
    {
      id_merch: totebag.id_merch,
      id_tujuan: tujuanUnit.id_tujuan,
      id_unit: unitHumas.id_unit,
      jumlah: 25,
      jumlah_kembali: 0,
      tanggal: daysAgo(7),
      keterangan: "Kebutuhan unit humas",
    },
    {
      id_merch: tumbler.id_merch,
      id_tujuan: tujuanLainnya.id_tujuan,
      detail_teks: "Hadiah kompetisi online",
      jumlah: 15,
      jumlah_kembali: 3,
      tanggal: daysAgo(2),
      keterangan: "Pengiriman hadiah pemenang",
    },
    {
      id_merch: totebag.id_merch,
      id_tujuan: tujuanStasiun.id_tujuan,
      id_stasiun: stasiunCawang.id_stasiun,
      jumlah: 10,
      jumlah_kembali: 0,
      tanggal: daysAgo(1),
      keterangan: "Promosi weekend",
    },
  ];

  for (const item of keluarData) {
    const keluar = await prisma.barangKeluar.create({
      data: {
        id_merch: item.id_merch,
        id_tujuan: item.id_tujuan,
        id_user: admin.id_user,
        id_stasiun: item.id_stasiun ?? null,
        id_unit: item.id_unit ?? null,
        detail_teks: item.detail_teks ?? null,
        jumlah: item.jumlah,
        jumlah_kembali: item.jumlah_kembali,
        status: item.jumlah_kembali > 0 ? "SEBAGIAN_KEMBALI" : "AKTIF",
        tanggal_keluar: item.tanggal,
        dicatat_pada: item.tanggal,
        keterangan: item.keterangan,
      },
    });

    if (item.jumlah_kembali > 0) {
      const tanggalKembali = new Date(item.tanggal);
      tanggalKembali.setDate(tanggalKembali.getDate() + 3);

      await prisma.barangKembali.create({
        data: {
          id_keluar: keluar.id_keluar,
          id_user: admin.id_user,
          jumlah_kembali: item.jumlah_kembali,
          tanggal_kembali: tanggalKembali,
          keterangan: "Pengembalian sebagian",
        },
      });
    }

    await prisma.stok.update({
      where: { id_merch: item.id_merch },
      data: { jumlah_stok: { decrement: item.jumlah } },
    });
  }

  console.log("✅ Seed selesai");
  console.log("Admin  : admin@lrt.co.id / password123");
  console.log("Petugas: petugas@lrt.co.id / password123");
  console.log(`Transaksi: ${masukData.length} masuk, ${keluarData.length} keluar`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
