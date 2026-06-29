import { headers } from "next/headers";
import type { NextRequest } from "next/server";

function firstIp(value: string | null): string | null {
  if (!value) return null;
  const ip = value.split(",")[0]?.trim();
  return ip || null;
}

// IP dari request proxy (NextRequest)
export function getClientIpFromRequest(request: NextRequest): string {
  return (
    firstIp(request.headers.get("x-forwarded-for")) ??
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    "unknown"
  );
}

// IP dari server action / server component
export async function getClientIp(): Promise<string> {
  const h = await headers();

  return (
    firstIp(h.get("x-forwarded-for")) ??
    h.get("x-real-ip") ??
    h.get("cf-connecting-ip") ??
    "unknown"
  );
}
