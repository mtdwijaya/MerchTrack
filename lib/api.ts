import bcrypt from "bcrypt";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Role } from "@prisma/client";

import { signAuthToken, verifyAuthToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { parseFormDateWithNowTime } from "@/lib/relative-time";

export interface ApiTokenPayload {
  id_user: number;
  email: string;
  role: Role;
  nama_user: string;
  id_stasiun: number | null;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

type RouteHandler<Ctx> = (
  req: NextRequest,
  ctx: Ctx
) => Promise<NextResponse> | NextResponse;

export function route<Ctx = unknown>(handler: RouteHandler<Ctx>) {
  return async (req: NextRequest, ctx: Ctx): Promise<NextResponse> => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      if (error instanceof ApiError) return jsonError(error.message, error.status);
      if (error instanceof z.ZodError) {
        return jsonError(error.issues[0]?.message ?? "Data tidak valid", 400);
      }
      if (error instanceof Error) return jsonError(error.message, 400);
      return jsonError("Terjadi kesalahan server", 500);
    }
  };
}

export async function authenticate(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError("Email atau password salah", 401);

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new ApiError("Email atau password salah", 401);

  const payload: ApiTokenPayload = {
    id_user: user.id_user,
    email: user.email,
    role: user.role,
    nama_user: user.nama_user,
    id_stasiun: user.id_stasiun,
  };

  const token = signAuthToken(payload);
  return { token, user: payload };
}

function getBearerToken(req: NextRequest): string | null {
  const header =
    req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!header) return null;

  // "Bearer abc.def.ghi" → scheme=Bearer, value=abc.def.ghi
  const [scheme, value] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !value) return null;

  return value.trim() || null;
}

export function requireUser(req: NextRequest): ApiTokenPayload {
  const token = getBearerToken(req);
  if (!token) {
    throw new ApiError(
      "Token tidak ada. Kirim header 'Authorization: Bearer <token>'",
      401
    );
  }

  try {
    return verifyAuthToken<ApiTokenPayload>(token);
  } catch {
    throw new ApiError("Token tidak valid atau sudah kadaluarsa", 401);
  }
}

export async function requireActiveUser(
  req: NextRequest
): Promise<ApiTokenPayload> {
  const user = requireUser(req);

  const fresh = await prisma.user.findUnique({
    where: { id_user: user.id_user },
    select: {
      role: true,
      id_stasiun: true,
      nama_user: true,
      email: true,
    },
  });

  if (!fresh) throw new ApiError("Pengguna tidak ditemukan", 401);

  return {
    id_user: user.id_user,
    email: fresh.email,
    role: fresh.role,
    nama_user: fresh.nama_user,
    id_stasiun: fresh.id_stasiun,
  };
}

export async function requireAdmin(req: NextRequest): Promise<ApiTokenPayload> {
  const user = await requireActiveUser(req);
  if (user.role !== "ADMIN") throw new ApiError("Akses khusus admin", 403);
  return user;
}

export async function parseJson<T>(
  req: NextRequest,
  schema: z.ZodType<T>
): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError("Body harus berupa JSON yang valid", 400);
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ApiError(result.error.issues[0]?.message ?? "Data tidak valid", 400);
  }
  return result.data;
}

export async function parseIdParam(ctx: {
  params: Promise<{ id: string }>;
}): Promise<number> {
  const { id } = await ctx.params;
  const num = Number(id);
  if (!Number.isInteger(num) || num <= 0) {
    throw new ApiError("ID tidak valid", 400);
  }
  return num;
}

export function parseTanggalKeluar(value?: string): Date | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return parseFormDateWithNowTime(trimmed);
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    throw new ApiError("Format tanggal_keluar tidak valid (pakai YYYY-MM-DD)", 400);
  }
  return date;
}

export function getQuery(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  return {
    str(key: string, fallback = "") {
      return sp.get(key) ?? fallback;
    },
    num(key: string, fallback: number) {
      const v = Number(sp.get(key));
      return Number.isFinite(v) && v > 0 ? v : fallback;
    },
    optionalNum(key: string) {
      const val = sp.get(key);
      if (!val) return undefined;
      const n = Number(val);
      return Number.isFinite(n) ? n : undefined;
    },
  };
}
