import { PrismaClient } from "@prisma/client";

// singleton prisma agar koneksi db tidak dibuat ulang tiap request (penting di dev/hot reload)
const globalForPrisma = globalThis as typeof globalThis & {
  __prisma?: PrismaClient;
};

export const prisma = globalForPrisma.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prisma = prisma;
}
