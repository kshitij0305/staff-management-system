import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, signSession, setSessionCookie } from "@/lib/auth";

/** List the current org's hierarchy levels, top (most senior) first. */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const levels = await prisma.level.findMany({
    where: { orgId: session.orgId },
    orderBy: { rank: "desc" },
    select: { id: true, name: true, rank: true, seesAll: true },
  });
  return NextResponse.json({ levels });
}

const saveSchema = z.object({
  // Level names ordered top → bottom (index 0 = most senior).
  levels: z.array(z.string().trim().min(1).max(40)).min(1).max(8),
});

/**
 * Define the org's hierarchy (onboarding wizard). Only a top-level user may do
 * this. Ranks are recomputed from order: top = N (seesAll), leaf = 1.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.seesAll) {
    return NextResponse.json({ error: "Only an owner can set up the hierarchy" }, { status: 403 });
  }

  const parsed = saveSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Add at least one level" }, { status: 400 });
  }
  const names = parsed.data.levels.map((n) => n.trim()).filter(Boolean);
  const n = names.length;

  // The signup-created top level (the one the owner sits on) is reused as the top.
  const topLevel = await prisma.level.findFirst({
    where: { orgId: session.orgId, seesAll: true },
    orderBy: { rank: "desc" },
  });
  if (!topLevel) return NextResponse.json({ error: "Org not initialised" }, { status: 400 });

  // Clean out any other levels that have no users yet (safe on a fresh org).
  await prisma.level.deleteMany({
    where: { orgId: session.orgId, id: { not: topLevel.id }, users: { none: {} } },
  });

  // Top level keeps its id (owner stays attached); rank N, named names[0].
  await prisma.level.update({
    where: { id: topLevel.id },
    data: { name: names[0], rank: n, seesAll: true },
  });

  // Remaining levels, descending: names[1] → rank n-1 … names[n-1] → rank 1.
  for (let i = 1; i < n; i++) {
    await prisma.level.create({
      data: { orgId: session.orgId, name: names[i], rank: n - i, seesAll: false },
    });
  }

  await prisma.organization.update({
    where: { id: session.orgId },
    data: { onboarded: true },
  });

  // The owner's rank changed (now N) — re-issue the session so it's current.
  const token = await signSession({
    sub: session.sub,
    name: session.name,
    employeeId: session.employeeId,
    orgId: session.orgId,
    levelRank: n,
    seesAll: true,
  });
  await setSessionCookie(token);

  return NextResponse.json({ ok: true });
}
