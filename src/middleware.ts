import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

const PUBLIC_API = ["/api/auth/login", "/api/auth/signup"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  // Logged-in users skip the auth pages.
  if (pathname === "/login" || pathname === "/signup") {
    if (session) return NextResponse.redirect(new URL("/dashboard", req.url));
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    // CSRF hardening: state-changing requests must come from our own origin.
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const origin = req.headers.get("origin");
      if (origin) {
        try {
          if (new URL(origin).host !== req.nextUrl.host) {
            return NextResponse.json({ error: "Cross-origin request blocked" }, { status: 403 });
          }
        } catch {
          return NextResponse.json({ error: "Cross-origin request blocked" }, { status: 403 });
        }
      }
    }
    if (PUBLIC_API.some((p) => pathname.startsWith(p))) return NextResponse.next();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Protected pages (dashboard + onboarding).
  if (!session) {
    const login = new URL("/login", req.url);
    if (pathname !== "/dashboard") login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding", "/api/:path*", "/login", "/signup"],
};
