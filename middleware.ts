import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  const pathname = request.nextUrl.pathname;

  const isAuthPage =
    pathname === "/login";

  if (isAuthPage && token) {
    return NextResponse.redirect(
      new URL("/dashboard", request.url)
    );
  }

  const protectedRoutes = [
    "/dashboard",
    "/barang-keluar",
    "/monitoring",
    "/merchandise",
    "/stasiun",
    "/riwayat-transaksi",
  ];

  const isProtected = protectedRoutes.some(
    (route) => pathname.startsWith(route)
  );

  if (isProtected && !token) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/barang-keluar/:path*",
    "/monitoring/:path*",
    "/merchandise/:path*",
    "/stasiun/:path*",
    "/riwayat-transaksi/:path*",
    "/login",
  ],
};