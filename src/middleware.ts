import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

const PUBLIC_API = ["/api/auth/login"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  // Logged-in users skip the login page
  if (pathname === "/login") {
    if (session) return NextResponse.redirect(new URL("/dashboard", req.url));
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    if (PUBLIC_API.some((p) => pathname.startsWith(p))) return NextResponse.next();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Dashboard pages
  if (!session) {
    const login = new URL("/login", req.url);
    if (pathname !== "/dashboard") login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*", "/login"],
};
