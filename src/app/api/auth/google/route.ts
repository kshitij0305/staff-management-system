import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { OAUTH_STATE_COOKIE } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";

/** Step 1: redirect the user to Google's consent screen. */
export async function GET(req: Request) {
  const ipCheck = rateLimit(`oauth:ip:${clientIp(req)}`, 30, 15 * 60 * 1000);
  if (!ipCheck.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(ipCheck.retryAfterSec) } }
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const url = new URL(req.url);

  if (!clientId || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(new URL("/login?error=google_not_configured", req.url));
  }

  const state = crypto.randomUUID();
  const remember = url.searchParams.get("remember") === "1";

  const store = await cookies();
  store.set(OAUTH_STATE_COOKIE, JSON.stringify({ state, remember }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60, // 10 minutes to complete the flow
  });

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", new URL("/api/auth/google/callback", req.url).toString());
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "select_account");

  return NextResponse.redirect(authUrl);
}
