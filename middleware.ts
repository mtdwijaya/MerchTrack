import { NextRequest, NextResponse } from "next/server";

const PUBLIC_API_ROUTES = ["/api/auth/login", "/api/auth/logout"];

// middleware: cek cookie token sebelum halaman dashboard atau api diproses
export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api/")) {
    const isPublicApi = PUBLIC_API_ROUTES.includes(pathname);

    // semua api wajib login kecuali login/logout
    if (!isPublicApi && !token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.next();
  }

  const isAuthPage = pathname === "/login";

  if (isAuthPage && token) {
    // sudah login → jangan buka halaman login lagi
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
    // belum login → arahkan ke login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
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
