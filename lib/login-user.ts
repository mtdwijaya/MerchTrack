import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

import { getAuthCookieOptions } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

type LoginResult =
  | { ok: true }
  | { ok: false; message: string };

export async function loginUser(
  email: string,
  password: string
): Promise<LoginResult> {
  if (!email || !password) {
    return { ok: false, message: "Email dan password wajib diisi" };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { ok: false, message: "Email atau password salah" };
  }

  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) {
    return { ok: false, message: "Email atau password salah" };
  }

  const token = jwt.sign(
    {
      id_user: user.id_user,
      email: user.email,
      role: user.role,
      nama_user: user.nama_user,
      id_stasiun: user.id_stasiun,
    },
    env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  const cookieStore = await cookies();
  cookieStore.set({
    name: "token",
    value: token,
    ...getAuthCookieOptions(60 * 60 * 24),
  });

  return { ok: true };
}
