import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🌱 Seeding database...");

    // Create stations first
    const stasiun1 = await prisma.stasiun.upsert({
      where: { kode_stasiun: "STN001" },
      update: {},
      create: {
        kode_stasiun: "STN001",
        nama_stasiun: "Stasiun Central",
        kontak: "021-1234567",
      },
    });

    const stasiun2 = await prisma.stasiun.upsert({
      where: { kode_stasiun: "STN002" },
      update: {},
      create: {
        kode_stasiun: "STN002",
        nama_stasiun: "Stasiun Barat",
        kontak: "021-7654321",
      },
    });

    console.log(`✓ Created/verified stations`);

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);

    const adminUser = await prisma.user.upsert({
      where: { email: "admin@kai.id" },
      update: {},
      create: {
        nama_user: "Admin",
        email: "admin@kai.id",
        password: hashedPassword,
        role: "ADMIN",
        id_stasiun: stasiun1.id_stasiun,
      },
    });

    console.log(`✓ Created admin user: ${adminUser.email}`);

    // Create petugas user
    const petugasUser = await prisma.user.upsert({
      where: { email: "petugas@kai.id" },
      update: {},
      create: {
        nama_user: "Petugas",
        email: "petugas@kai.id",
        password: hashedPassword,
        role: "PETUGAS",
        id_stasiun: stasiun2.id_stasiun,
      },
    });

    console.log(`✓ Created petugas user: ${petugasUser.email}`);

    console.log("\n✅ Seeding completed successfully!");
    console.log("\n📝 Test Credentials:");
    console.log("  Admin:");
    console.log("    Email: admin@kai.id");
    console.log("    Password: admin123");
    console.log("\n  Petugas:");
    console.log("    Email: petugas@kai.id");
    console.log("    Password: admin123");
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
