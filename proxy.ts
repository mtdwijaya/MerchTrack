import { NextRequest, NextResponse } from "next/server";

// proxy: cek cookie token sebelum halaman diproses (pengganti middleware di next.js 16)
export function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const pathname = request.nextUrl.pathname;

  const isAdminLogin = pathname === "/admin/login";
  const isTabletLogin = pathname === "/login";

  if (isAdminLogin && token) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (isTabletLogin && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const isAdminProtected =
    pathname === "/admin" || pathname.startsWith("/admin/");
  const isTabletHome = pathname === "/";

  if (isAdminProtected && !isAdminLogin && !token) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (isTabletHome && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/admin", "/admin/:path*"],
};
