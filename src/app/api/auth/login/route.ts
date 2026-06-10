import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signSession, setSessionCookie } from "@/lib/auth";
import { logActivity } from "@/features/activity/log";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
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

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  // Same error for unknown email / wrong password — don't leak which one.
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }
  if (user.status === "INACTIVE") {
    return NextResponse.json(
      { error: "This account has been deactivated. Contact your manager." },
      { status: 403 }
    );
  }

  const token = await signSession({
    sub: user.id,
    role: user.role,
    name: user.name,
    employeeId: user.employeeId,
  });
  await setSessionCookie(token);

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
