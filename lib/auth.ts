import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/jwt";

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
    return verifyAuthToken<JwtPayload>(token);
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

// baca role terbaru dari db — untuk guard admin (jwt role bisa basi setelah diubah admin lain)
export const getFreshUserFromDb = cache(
  async (id_user: number): Promise<CurrentUser | null> => {
    return prisma.user.findUnique({
      where: { id_user },
      select: {
        id_user: true,
        id_stasiun: true,
        nama_user: true,
        email: true,
        role: true,
      },
    });
  }
);

export function getAuthCookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    ...(maxAge !== undefined ? { maxAge } : {}),
  };
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set({
    name: "token",
    value: "",
    ...getAuthCookieOptions(),
    maxAge: 0,
  });
}

// hasil cek auth untuk server action (selaras dengan { ok, message } di actions)
export type ActionAuthResult =
  | { ok: true; user: CurrentUser }
  | { ok: false; message: string };

// wajib dipanggil di awal server action — proxy tidak melindungi action
// role selalu dibaca ulang dari DB agar demote/promote langsung berlaku
export async function requireActionUser(): Promise<ActionAuthResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Unauthorized" };
  }

  const freshUser = await getFreshUserFromDb(user.id_user);
  if (!freshUser) {
    return { ok: false, message: "Unauthorized" };
  }

  return { ok: true, user: freshUser };
}

// untuk action master data: stasiun, merchandise, pengguna
export async function requireActionAdmin(): Promise<ActionAuthResult> {
  const auth = await requireActionUser();
  if (!auth.ok) return auth;

  if (auth.user.role !== "ADMIN") {
    return { ok: false, message: "Forbidden" };
  }

  return auth;
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