import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const isAdmin = req.nextUrl.pathname.startsWith("/admin");
  if (isAdmin && req.nextUrl.pathname !== "/admin/login") {
    const auth = req.cookies.get("admin_auth");
    if (!auth || auth.value !== "1") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
