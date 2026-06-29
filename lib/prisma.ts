import { PrismaClient } from "@prisma/client";

import { env } from "@/lib/env";

// pastikan DATABASE_URL ada sebelum prisma client dibuat
void env.DATABASE_URL;

// singleton prisma agar koneksi db tidak dibuat ulang tiap request (penting di dev/hot reload)
const globalForPrisma = globalThis as typeof globalThis & {
  __prisma?: PrismaClient;
};

export const prisma = globalForPrisma.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prisma = prisma;
}
