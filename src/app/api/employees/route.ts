import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma, Role, EmployeeStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canCreate, scopedUserWhere, seesEverything, MANAGER_ROLE } from "@/lib/rbac";
import { createEmployeeSchema } from "@/features/employees/schemas";
import { logActivity } from "@/features/activity/log";
import { ROLE_LABELS } from "@/lib/constants";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const role = url.searchParams.get("role");
  const status = url.searchParams.get("status");
  const managerId = url.searchParams.get("managerId");
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.min(200, Math.max(1, Number(url.searchParams.get("pageSize")) || 20));

  const where: Prisma.UserWhereInput = {
    AND: [
      scopedUserWhere(session),
      role && Object.values(Role).includes(role as Role) ? { role: role as Role } : {},
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
        role: true,
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

async function nextEmployeeId(): Promise<string> {
  const last = await prisma.user.findFirst({
    orderBy: { employeeId: "desc" },
    select: { employeeId: true },
  });
  const lastNum = last ? Number(last.employeeId.replace(/\D/g, "")) : 0;
  return `VK-${String(lastNum + 1).padStart(4, "0")}`;
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

  if (!canCreate(session.role, input.role)) {
    return NextResponse.json(
      { error: `A ${ROLE_LABELS[session.role]} cannot create a ${ROLE_LABELS[input.role]}` },
      { status: 403 }
    );
  }

  // Resolve the manager: explicit managerId, or the actor themselves when their role fits.
  const requiredManagerRole = MANAGER_ROLE[input.role];
  if (!requiredManagerRole) {
    return NextResponse.json({ error: "Cannot create another Owner" }, { status: 400 });
  }
  let managerId = input.managerId;
  if (!managerId && session.role === requiredManagerRole) managerId = session.sub;
  if (!managerId) {
    return NextResponse.json(
      { error: `Pick the ${ROLE_LABELS[requiredManagerRole]} this employee reports to` },
      { status: 400 }
    );
  }
  const manager = await prisma.user.findUnique({
    where: { id: managerId },
    select: { id: true, name: true, role: true, status: true, ancestorIds: true },
  });
  if (!manager || manager.status === "INACTIVE") {
    return NextResponse.json({ error: "Manager not found or inactive" }, { status: 400 });
  }
  if (manager.role !== requiredManagerRole) {
    return NextResponse.json(
      { error: `A ${ROLE_LABELS[input.role]} must report to a ${ROLE_LABELS[requiredManagerRole]}` },
      { status: 400 }
    );
  }
  // The chosen manager must be the actor or inside the actor's scope.
  if (
    !seesEverything(session.role) &&
    manager.id !== session.sub &&
    !manager.ancestorIds.includes(session.sub)
  ) {
    return NextResponse.json({ error: "Manager is outside your team" }, { status: 403 });
  }

  try {
    const user = await prisma.user.create({
      data: {
        employeeId: await nextEmployeeId(),
        name: input.name,
        email: input.email,
        phone: input.phone,
        passwordHash: await bcrypt.hash(input.password, 10),
        role: input.role,
        managerId: manager.id,
        ancestorIds: [...manager.ancestorIds, manager.id],
        joiningDate: input.joiningDate ?? new Date(),
        city: input.city || null,
        state: input.state || null,
        avatarSeed: input.name,
      },
      select: { id: true, name: true, role: true, employeeId: true },
    });

    await logActivity({
      actorId: session.sub,
      action: "EMPLOYEE_CREATED",
      targetType: "USER",
      targetId: user.id,
      summary: `added ${user.name} as ${ROLE_LABELS[user.role]} (reports to ${manager.name})`,
    });

    return NextResponse.json({ employee: user }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "An employee with this email already exists" }, { status: 409 });
    }
    throw err;
  }
}
