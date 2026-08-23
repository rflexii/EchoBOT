import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, isAdminEmail } from "@/lib/auth";

/**
 * Guards /admin routes. Unauthenticated users are sent to /admin/login.
 * The login page itself and all API routes are left to their own auth logic.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only guard the admin section
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Let the login page through
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const raw = req.cookies.get(AUTH_COOKIE)?.value;
  if (!raw) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  const decoded = Buffer.from(raw, "base64").toString("utf8");
  const [email, secret] = decoded.split(":");
  if (!email || !isAdminEmail(email) || secret !== (process.env.AUTH_SECRET ?? "dev-secret")) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
