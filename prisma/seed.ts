import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Start seeding...");

  // =========================
  // PASSWORD
  // =========================

  const hashedPassword = await bcrypt.hash(
    "password123",
    10
  );

  // =========================
  // KATEGORI PENGGUNAAN
  // =========================

  const kategoriEvent =
    await prisma.kategoriPenggunaan.upsert({
      where: {
        nama_kategori: "Event",
      },
      update: {},
      create: {
        nama_kategori: "Event",
      },
    });

  const kategoriUnit =
    await prisma.kategoriPenggunaan.upsert({
      where: {
        nama_kategori:
          "Dibagikan ke Unit Lain",
      },
      update: {},
      create: {
        nama_kategori:
          "Dibagikan ke Unit Lain",
      },
    });

  const kategoriPenumpang =
    await prisma.kategoriPenggunaan.upsert({
      where: {
        nama_kategori:
          "Dibagikan ke Penumpang",
      },
      update: {},
      create: {
        nama_kategori:
          "Dibagikan ke Penumpang",
      },
    });

  const kategoriLainnya =
    await prisma.kategoriPenggunaan.upsert({
      where: {
        nama_kategori: "Lainnya",
      },
      update: {},
      create: {
        nama_kategori: "Lainnya",
      },
    });

  // =========================
  // STASIUN
  // =========================

  const stasiunData = [
    {
      kode_stasiun: "STN-001",
      nama_stasiun: "Harjamukti",
      alamat: "Depok",
      kontak: "(021)100001",
    },
    {
      kode_stasiun: "STN-002",
      nama_stasiun: "Ciracas",
      alamat: "Jakarta Timur",
      kontak: "(021)100002",
    },
    {
      kode_stasiun: "STN-003",
      nama_stasiun: "Cawang",
      alamat: "Jakarta Timur",
      kontak: "(021)100003",
    },
    {
      kode_stasiun: "STN-004",
      nama_stasiun: "Dukuh Atas",
      alamat: "Jakarta Pusat",
      kontak: "(021)100004",
    },
    {
      kode_stasiun: "STN-005",
      nama_stasiun: "Kuningan",
      alamat: "Jakarta Selatan",
      kontak: "(021)100005",
    },
    {
      kode_stasiun: "STN-006",
      nama_stasiun: "Jatimulya",
      alamat: "Bekasi",
      kontak: "(021)100006",
    },
  ];

  for (const stasiun of stasiunData) {
    await prisma.stasiun.upsert({
      where: {
        kode_stasiun:
          stasiun.kode_stasiun,
      },
      update: {},
      create: stasiun,
    });
  }

  // =========================
  // MERCHANDISE
  // =========================

  const tumbler =
    await prisma.merchandise.upsert({
      where: {
        id_merch: 1,
      },
      update: {},
      create: {
        nama_merch:
          "Tumbler Stainless LRT",
        deskripsi:
          "Tumbler official LRT Jabodebek",
      },
    });

  const bantal =
    await prisma.merchandise.upsert({
      where: {
        id_merch: 2,
      },
      update: {},
      create: {
        nama_merch:
          "Bantal Leher LRT",
        deskripsi:
          "Bantal perjalanan penumpang",
      },
    });

  const totebag =
    await prisma.merchandise.upsert({
      where: {
        id_merch: 3,
      },
      update: {},
      create: {
        nama_merch:
          "Totebag Kanvas LRT",
        deskripsi:
          "Totebag resmi LRT",
      },
    });

  // =========================
  // STOK
  // =========================

  await prisma.stok.upsert({
    where: {
      id_merch: tumbler.id_merch,
    },
    update: {
      jumlah_stok: 500,
    },
    create: {
      id_merch: tumbler.id_merch,
      jumlah_stok: 500,
    },
  });

  await prisma.stok.upsert({
    where: {
      id_merch: bantal.id_merch,
    },
    update: {
      jumlah_stok: 150,
    },
    create: {
      id_merch: bantal.id_merch,
      jumlah_stok: 150,
    },
  });

  await prisma.stok.upsert({
    where: {
      id_merch: totebag.id_merch,
    },
    update: {
      jumlah_stok: 300,
    },
    create: {
      id_merch: totebag.id_merch,
      jumlah_stok: 300,
    },
  });

  // =========================
  // USER ADMIN
  // =========================

  await prisma.user.upsert({
    where: {
      email: "admin@lrt.co.id",
    },
    update: {},
    create: {
      nama_user: "Administrator",
      email: "admin@lrt.co.id",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  // =========================
  // USER PETUGAS
  // =========================

  await prisma.user.upsert({
    where: {
      email: "petugas@lrt.co.id",
    },
    update: {},
    create: {
      nama_user: "Petugas Gudang",
      email: "petugas@lrt.co.id",
      password: hashedPassword,
      role: "PETUGAS",
    },
  });

  console.log("✅ Seed selesai");

  console.log(
    "Admin : admin@lrt.co.id / password123"
  );

  console.log(
    "Petugas : petugas@lrt.co.id / password123"
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });