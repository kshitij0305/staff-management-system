import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { signSession, setSessionCookie, REMEMBER_DAYS, OAUTH_STATE_COOKIE } from "@/lib/auth";
import { logActivity } from "@/features/activity/log";

const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

function fail(req: Request, error: string) {
  return NextResponse.redirect(new URL(`/login?error=${error}`, req.url));
}

/** Step 2: Google redirects back here. Exchange the code, then map the Google email to an employee. */
export async function GET(req: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return fail(req, "google_not_configured");

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return fail(req, "google_failed");

  // CSRF check against the state we set when starting the flow
  const store = await cookies();
  const stateCookie = store.get(OAUTH_STATE_COOKIE)?.value;
  store.set(OAUTH_STATE_COOKIE, "", { path: "/", maxAge: 0 });
  let remember = false;
  try {
    const parsed = JSON.parse(stateCookie ?? "{}");
    if (parsed.state !== state) return fail(req, "google_failed");
    remember = parsed.remember === true;
  } catch {
    return fail(req, "google_failed");
  }

  // Exchange the authorization code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: new URL("/api/auth/google/callback", req.url).toString(),
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) return fail(req, "google_failed");
  const tokens: { id_token?: string } = await tokenRes.json();
  if (!tokens.id_token) return fail(req, "google_failed");

  // Verify the ID token signature, issuer and audience
  let email: string | undefined;
  let emailVerified = false;
  try {
    const { payload } = await jwtVerify(tokens.id_token, GOOGLE_JWKS, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: clientId,
    });
    email = (payload.email as string | undefined)?.toLowerCase();
    emailVerified = payload.email_verified === true;
  } catch {
    return fail(req, "google_failed");
  }
  if (!email || !emailVerified) return fail(req, "google_failed");

  // No public sign-up: the Google email must belong to an existing employee
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return fail(req, "no_account");
  if (user.status === "INACTIVE") return fail(req, "deactivated");

  const days = remember ? REMEMBER_DAYS : undefined;
  const token = await signSession(
    { sub: user.id, role: user.role, name: user.name, employeeId: user.employeeId },
    days
  );
  await setSessionCookie(token, days);

  await logActivity({
    actorId: user.id,
    action: "USER_LOGIN",
    targetType: "AUTH",
    summary: "signed in with Google",
  });

  return NextResponse.redirect(new URL("/dashboard", req.url));
}
