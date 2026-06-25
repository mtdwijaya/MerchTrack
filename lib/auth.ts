import { cache } from "react";
import { cookies } from "next/headers";
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

export function getAuthCookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    ...(maxAge !== undefined ? { maxAge } : {}),
  };
}