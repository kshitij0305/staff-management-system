import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma, EmployeeStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canCreateRank, scopedUserWhere, seesEverything, managerRankFor } from "@/lib/rbac";
import { createEmployeeSchema } from "@/features/employees/schemas";
import { logActivity } from "@/features/activity/log";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const levelId = url.searchParams.get("levelId");
  const status = url.searchParams.get("status");
  const managerId = url.searchParams.get("managerId");
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.min(200, Math.max(1, Number(url.searchParams.get("pageSize")) || 20));

  const where: Prisma.UserWhereInput = {
    AND: [
      scopedUserWhere(session),
      levelId ? { levelId } : {},
      status && Object.values(EmployeeStatus).includes(status as EmployeeStatus)
        ? { status: status as EmployeeStatus }
        : {},
      managerId ? { managerId } : {},
      q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { employeeId: { contains: q, mode: "insensitive" } },
            ],
          }
        : {},
    ],
  };

  const [total, employees] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: [{ name: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        phone: true,
        level: { select: { id: true, name: true, rank: true, seesAll: true } },
        status: true,
        joiningDate: true,
        city: true,
        state: true,
        manager: { select: { id: true, name: true } },
        _count: { select: { reports: true, prospects: true } },
      },
    }),
  ]);

  return NextResponse.json({ employees, total, page, pageSize });
}

/** Next employee id, unique within the org. */
async function nextEmployeeId(orgId: string): Promise<string> {
  const last = await prisma.user.findFirst({
    where: { organizationId: orgId },
    orderBy: { employeeId: "desc" },
    select: { employeeId: true },
  });
  const lastNum = last ? Number(last.employeeId.replace(/\D/g, "")) : 0;
  return `EMP-${String(lastNum + 1).padStart(4, "0")}`;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createEmployeeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const input = parsed.data;

  // Target level must belong to the actor's org.
  const targetLevel = await prisma.level.findFirst({
    where: { id: input.levelId, orgId: session.orgId },
  });
  if (!targetLevel) {
    return NextResponse.json({ error: "Unknown level" }, { status: 400 });
  }
  if (!canCreateRank(session, targetLevel.rank)) {
    return NextResponse.json(
      { error: `You can't create someone at the "${targetLevel.name}" level` },
      { status: 403 }
    );
  }

  // Resolve the manager: explicit managerId, or the actor when their rank fits.
  const requiredRank = managerRankFor(targetLevel.rank);
  let managerId = input.managerId;
  if (!managerId && session.levelRank === requiredRank) managerId = session.sub;
  if (!managerId) {
    return NextResponse.json(
      { error: "Pick the manager this employee reports to" },
      { status: 400 }
    );
  }
  const manager = await prisma.user.findFirst({
    where: { id: managerId, organizationId: session.orgId },
    select: { id: true, name: true, status: true, ancestorIds: true, level: { select: { rank: true } } },
  });
  if (!manager || manager.status === "INACTIVE") {
    return NextResponse.json({ error: "Manager not found or inactive" }, { status: 400 });
  }
  if (manager.level.rank !== requiredRank) {
    return NextResponse.json(
      { error: `A "${targetLevel.name}" must report to the level directly above it` },
      { status: 400 }
    );
  }
  // The chosen manager must be the actor or inside the actor's scope.
  if (
    !seesEverything(session) &&
    manager.id !== session.sub &&
    !manager.ancestorIds.includes(session.sub)
  ) {
    return NextResponse.json({ error: "Manager is outside your team" }, { status: 403 });
  }

  try {
    const user = await prisma.user.create({
      data: {
        organizationId: session.orgId,
        employeeId: await nextEmployeeId(session.orgId),
        name: input.name,
        email: input.email,
        phone: input.phone,
        passwordHash: await bcrypt.hash(input.password, 10),
        levelId: targetLevel.id,
        managerId: manager.id,
        ancestorIds: [...manager.ancestorIds, manager.id],
        joiningDate: input.joiningDate ?? new Date(),
        city: input.city || null,
        state: input.state || null,
        avatarSeed: input.name,
      },
      select: { id: true, name: true, employeeId: true },
    });

    await logActivity({
      organizationId: session.orgId,
      actorId: session.sub,
      action: "EMPLOYEE_CREATED",
      targetType: "USER",
      targetId: user.id,
      summary: `added ${user.name} as ${targetLevel.name} (reports to ${manager.name})`,
    });

    return NextResponse.json({ employee: user }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "An employee with this email already exists" }, { status: 409 });
    }
    throw err;
  }
}
