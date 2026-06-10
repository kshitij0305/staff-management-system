import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signSession, setSessionCookie, REMEMBER_DAYS } from "@/lib/auth";
import { logActivity } from "@/features/activity/log";
import { rateLimit, clearRateLimit, clientIp } from "@/lib/rate-limit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  remember: z.boolean().optional(),
});

// Pre-computed hash of a throwaway password. Compared against when the email
// doesn't exist so unknown and known emails take the same time to respond
// (prevents user enumeration via timing).
const DUMMY_HASH = bcrypt.hashSync("timing-equalizer-dummy", 10);

const WINDOW_MS = 15 * 60 * 1000;
const IP_LIMIT = 20; // attempts per window per IP
const EMAIL_LIMIT = 8; // attempts per window per account

function tooMany(retryAfterSec: number) {
  const minutes = Math.max(1, Math.ceil(retryAfterSec / 60));
  return NextResponse.json(
    { error: `Too many attempts. Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.` },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
  );
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  const ipCheck = rateLimit(`login:ip:${ip}`, IP_LIMIT, WINDOW_MS);
  if (!ipCheck.ok) return tooMany(ipCheck.retryAfterSec);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email and password" }, { status: 400 });
  }

  const { password, remember } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  const emailCheck = rateLimit(`login:email:${email}`, EMAIL_LIMIT, WINDOW_MS);
  if (!emailCheck.ok) return tooMany(emailCheck.retryAfterSec);

  const user = await prisma.user.findUnique({ where: { email } });

  // Same error and same bcrypt cost for unknown email / wrong password —
  // don't leak which one failed, by message or by timing.
  const passwordOk = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !passwordOk) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }
  if (user.status === "INACTIVE") {
    return NextResponse.json(
      { error: "This account has been deactivated. Contact your manager." },
      { status: 403 }
    );
  }

  // Successful sign-in forgives earlier failed attempts.
  clearRateLimit(`login:email:${email}`);
  clearRateLimit(`login:ip:${ip}`);

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
    summary: "signed in",
  });

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}
