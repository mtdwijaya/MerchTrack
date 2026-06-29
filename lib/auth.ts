import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export interface JwtPayload {
  id_user: number;
  email: string;
  role: string;
  nama_user?: string;
  id_stasiun?: number | null;
}

export type CurrentUser = {
  id_user: number;
  id_stasiun: number | null;
  nama_user: string;
  email: string;
  role: Role;
};

export async function verifyToken() {
  try {
    const cookieStore = await cookies();

    const token =
      cookieStore.get("token")?.value;

    if (!token) {
      return null;
    }

    // verifikasi jwt dari cookie httpOnly "token"
    return jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as JwtPayload;
  } catch {
    return null;
  }
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const tokenData = await verifyToken();
  if (!tokenData) return null;

  // baca user dari jwt supaya tidak query db di setiap navigasi halaman
  if (tokenData.nama_user) {
    return {
      id_user: tokenData.id_user,
      id_stasiun: tokenData.id_stasiun ?? null,
      nama_user: tokenData.nama_user,
      email: tokenData.email,
      role: tokenData.role as Role,
    };
  }

  // fallback untuk token lama yang belum menyimpan nama_user di jwt
  const user = await prisma.user.findUnique({
    where: { id_user: tokenData.id_user },
    select: {
      id_user: true,
      id_stasiun: true,
      nama_user: true,
      email: true,
      role: true,
    },
  });

  return user;
});

const freshUserSelect = {
  id_user: true,
  id_stasiun: true,
  nama_user: true,
  email: true,
  role: true,
} as const;

// baca role terbaru dari db — jwt tidak ikut berubah kalau admin edit role user
async function getFreshUserFromDb(
  id_user: number
): Promise<CurrentUser | null> {
  return prisma.user.findUnique({
    where: { id_user },
    select: freshUserSelect,
  });
}

export function getAuthCookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    ...(maxAge !== undefined ? { maxAge } : {}),
  };
}

// hasil cek auth untuk server action (selaras dengan { ok, message } di actions)
export type ActionAuthResult =
  | { ok: true; user: CurrentUser }
  | { ok: false; message: string };

// wajib dipanggil di awal server action — middleware tidak melindungi action
export async function requireActionUser(): Promise<ActionAuthResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Unauthorized" };
  }
  return { ok: true, user };
}

// untuk action master data: stasiun, merchandise, pengguna
export async function requireActionAdmin(): Promise<ActionAuthResult> {
  const auth = await requireActionUser();
  if (!auth.ok) return auth;

  const freshUser = await getFreshUserFromDb(auth.user.id_user);
  if (!freshUser) {
    return { ok: false, message: "Unauthorized" };
  }
  if (freshUser.role !== "ADMIN") {
    return { ok: false, message: "Forbidden" };
  }

  return { ok: true, user: freshUser };
}

// guard halaman master data — redirect jika bukan admin (dipakai di page.tsx)
export async function requireAdminPage(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const freshUser = await getFreshUserFromDb(user.id_user);
  if (!freshUser) redirect("/login");
  if (freshUser.role !== "ADMIN") redirect("/dashboard");

  return freshUser;
}