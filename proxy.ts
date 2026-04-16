import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./lib/auth";

export async function proxy(req: NextRequest) {
  const token = await auth();

  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");

  if (isAdminRoute) {
    if (!token || token.user?.role !== "admin") {
      return NextResponse.redirect(
        new URL("/api/auth/signin?callbackUrl=/admin", req.url),
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
