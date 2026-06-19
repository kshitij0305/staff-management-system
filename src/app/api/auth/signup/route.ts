import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { signSession, setSessionCookie } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const signupSchema = z.object({
  orgName: z.string().trim().min(2, "Company name is too short").max(80),
  name: z.string().trim().min(2, "Your name is too short").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "org"
  );
}

/** Public self-serve signup: creates a new tenant + its first Owner, then signs them in. */
export async function POST(req: Request) {
  const ip = clientIp(req);
  const limit = rateLimit(`signup:ip:${ip}`, 5, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many signups. Try again later." }, { status: 429 });
  }

  const parsed = signupSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { orgName, name, password } = parsed.data;
  const email = parsed.data.email;

  // Unique slug.
  const base = slugify(orgName);
  let slug = base;
  for (let i = 2; await prisma.organization.findUnique({ where: { slug } }); i++) {
    slug = `${base}-${i}`;
  }

  try {
    // Create org + a provisional top level + the first user (the Owner).
    const org = await prisma.organization.create({ data: { name: orgName, slug } });
    const topLevel = await prisma.level.create({
      data: { orgId: org.id, name: "Owner", rank: 1, seesAll: true },
    });
    const user = await prisma.user.create({
      data: {
        organizationId: org.id,
        levelId: topLevel.id,
        employeeId: "EMP-0001",
        name,
        email,
        phone: "",
        passwordHash: await bcrypt.hash(password, 10),
        ancestorIds: [],
        avatarSeed: name,
      },
    });

    const token = await signSession({
      sub: user.id,
      name: user.name,
      employeeId: user.employeeId,
      orgId: org.id,
      levelRank: topLevel.rank,
      seesAll: true,
    });
    await setSessionCookie(token);

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }
    throw err;
  }
}
