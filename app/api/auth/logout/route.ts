import { NextResponse } from "next/server";

import { getAuthCookieOptions } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({
    message: "Logout berhasil",
  });

  response.cookies.set({
    name: "token",
    value: "",
    ...getAuthCookieOptions(),
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}
