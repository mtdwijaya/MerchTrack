import { prisma } from "@/lib/prisma";
import { Prisma, Role } from "@prisma/client";
import bcrypt from "bcrypt";
import { SortOrder } from "@/lib/sort";

export type PenggunaSortField =
  | "id_user"
  | "nama_user"
  | "email"
  | "role";

const SORT_FIELDS: PenggunaSortField[] = [
  "id_user",
  "nama_user",
  "email",
  "role",
];

export function parsePenggunaSort(
  sortBy?: string | null,
  sortOrder?: string | null
): { sortBy: PenggunaSortField; sortOrder: SortOrder } {
  const field = SORT_FIELDS.includes(sortBy as PenggunaSortField)
    ? (sortBy as PenggunaSortField)
    : "nama_user";

  return {
    sortBy: field,
    sortOrder: sortOrder === "desc" ? "desc" : "asc",
  };
}

export async function getPenggunaPaginated({
  page,
  limit,
  search,
  sortBy = "nama_user",
  sortOrder = "asc",
  role,
}: {
  page: number;
  limit: number;
  search?: string;
  sortBy?: PenggunaSortField;
  sortOrder?: SortOrder;
  role?: Role;
}) {
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {};

  if (search?.trim()) {
    where.OR = [
      { nama_user: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (role) {
    where.role = role;
  }

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { stasiun: true },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: data.map(({ password: _password, ...user }) => user),
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getPenggunaById(id: number) {
  const user = await prisma.user.findUnique({
    where: { id_user: id },
    include: { stasiun: true },
  });

  if (!user) return null;

  const { password: _password, ...safeUser } = user;
  return safeUser;
}

export async function getPenggunaSummary() {
  const [totalPengguna, totalAdmin, totalPetugas] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { role: "PETUGAS" } }),
  ]);

  return { totalPengguna, totalAdmin, totalPetugas };
}

export async function createPengguna(data: {
  nama_user: string;
  email: string;
  password: string;
  role: Role;
  id_stasiun?: number;
}) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    throw new Error("Email sudah digunakan");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      nama_user: data.nama_user,
      email: data.email,
      password: hashedPassword,
      role: data.role,
      id_stasiun: data.id_stasiun || null,
    },
    include: { stasiun: true },
  });

  const { password: _password, ...safeUser } = user;
  return safeUser;
}

export async function updatePengguna(
  id: number,
  data: {
    nama_user: string;
    email: string;
    password?: string;
    role: Role;
    id_stasiun?: number | null;
  }
) {
  const existing = await prisma.user.findFirst({
    where: {
      email: data.email,
      NOT: { id_user: id },
    },
  });

  if (existing) {
    throw new Error("Email sudah digunakan");
  }

  const updateData: Prisma.UserUpdateInput = {
    nama_user: data.nama_user,
    email: data.email,
    role: data.role,
    stasiun: data.id_stasiun
      ? { connect: { id_stasiun: data.id_stasiun } }
      : { disconnect: true },
  };

  if (data.password?.trim()) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }

  const user = await prisma.user.update({
    where: { id_user: id },
    data: updateData,
    include: { stasiun: true },
  });

  const { password: _password, ...safeUser } = user;
  return safeUser;
}

export async function deletePengguna(id: number) {
  const user = await prisma.user.findUnique({
    where: { id_user: id },
    include: {
      _count: {
        select: {
          barangKeluar: true,
          barangMasuk: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("Pengguna tidak ditemukan");
  }

  if (user._count.barangKeluar > 0 || user._count.barangMasuk > 0) {
    throw new Error(
      "Pengguna tidak dapat dihapus karena masih memiliki transaksi"
    );
  }

  return prisma.user.delete({
    where: { id_user: id },
  });
}
