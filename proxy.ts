import { NextRequest, NextResponse } from "next/server";

// proxy: cek cookie token sebelum halaman dashboard diproses (pengganti middleware di next.js 16)
export function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  const pathname = request.nextUrl.pathname;

  const isAuthPage = pathname === "/login";

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const protectedRoutes = [
    "/dashboard",
    "/barang-keluar",
    "/monitoring",
    "/merchandise",
    "/pengguna",
    "/stasiun",
    "/riwayat-transaksi",
  ];

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/barang-keluar/:path*",
    "/monitoring/:path*",
    "/merchandise/:path*",
    "/pengguna/:path*",
    "/stasiun/:path*",
    "/riwayat-transaksi/:path*",
    "/login",
  ],
};
