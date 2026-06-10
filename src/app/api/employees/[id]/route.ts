import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canManageUser, scopedUserWhere } from "@/lib/rbac";
import { updateEmployeeSchema } from "@/features/employees/schemas";
import { logActivity } from "@/features/activity/log";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const employee = await prisma.user.findFirst({
    // scopedUserWhere already includes the viewer themselves; `{}` for executives = see all.
    where: { AND: [{ id }, scopedUserWhere(session)] },
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
      ancestorIds: true,
      manager: { select: { id: true, name: true, role: true } },
      reports: {
        select: { id: true, name: true, role: true, status: true, _count: { select: { prospects: true } } },
        orderBy: { name: "asc" },
      },
      _count: { select: { reports: true, prospects: true } },
    },
  });
  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ employee });
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, role: true, status: true, ancestorIds: true },
  });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canManageUser(session, target)) {
    return NextResponse.json({ error: "You cannot manage this employee" }, { status: 403 });
  }

  const parsed = updateEmployeeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const input = parsed.data;

  const data: Prisma.UserUpdateInput = {};
  if (input.name) data.name = input.name;
  if (input.email) data.email = input.email;
  if (input.phone) data.phone = input.phone;
  if (input.city !== undefined) data.city = input.city || null;
  if (input.state !== undefined) data.state = input.state || null;
  if (input.status) data.status = input.status;
  if (input.password) data.passwordHash = await bcrypt.hash(input.password, 10);

  try {
    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, status: true, role: true },
    });

    const statusChanged = input.status && input.status !== target.status;
    await logActivity({
      actorId: session.sub,
      action: statusChanged
        ? input.status === "INACTIVE"
          ? "EMPLOYEE_DEACTIVATED"
          : "EMPLOYEE_REACTIVATED"
        : "EMPLOYEE_UPDATED",
      targetType: "USER",
      targetId: updated.id,
      summary: statusChanged
        ? `${input.status === "INACTIVE" ? "deactivated" : "reactivated"} ${updated.name}`
        : `updated ${updated.name}'s profile`,
    });

    return NextResponse.json({ employee: updated });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "An employee with this email already exists" }, { status: 409 });
    }
    throw err;
  }
}
