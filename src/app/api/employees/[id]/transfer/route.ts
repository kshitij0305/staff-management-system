import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canManageUser, seesEverything, MANAGER_ROLE } from "@/lib/rbac";
import { transferEmployeeSchema } from "@/features/employees/schemas";
import { logActivity } from "@/features/activity/log";
import { ROLE_LABELS } from "@/lib/constants";

type Params = { params: Promise<{ id: string }> };

/**
 * Re-parent an employee under a new manager and rebuild the materialized
 * ancestor path for the employee and their entire subtree.
 */
export async function POST(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const parsed = transferEmployeeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Pick a new manager" }, { status: 400 });
  }
  const { managerId } = parsed.data;

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, role: true, managerId: true, ancestorIds: true },
  });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canManageUser(session, target)) {
    return NextResponse.json({ error: "You cannot manage this employee" }, { status: 403 });
  }
  if (managerId === target.managerId) {
    return NextResponse.json({ error: "Already reporting to this manager" }, { status: 400 });
  }
  if (managerId === target.id) {
    return NextResponse.json({ error: "An employee cannot manage themselves" }, { status: 400 });
  }

  const requiredManagerRole = MANAGER_ROLE[target.role];
  if (!requiredManagerRole) {
    return NextResponse.json({ error: "The Owner cannot be transferred" }, { status: 400 });
  }

  const newManager = await prisma.user.findUnique({
    where: { id: managerId },
    select: { id: true, name: true, role: true, status: true, ancestorIds: true },
  });
  if (!newManager || newManager.status === "INACTIVE") {
    return NextResponse.json({ error: "Manager not found or inactive" }, { status: 400 });
  }
  if (newManager.role !== requiredManagerRole) {
    return NextResponse.json(
      { error: `A ${ROLE_LABELS[target.role]} must report to a ${ROLE_LABELS[requiredManagerRole]}` },
      { status: 400 }
    );
  }
  if (newManager.ancestorIds.includes(target.id)) {
    return NextResponse.json(
      { error: "Cannot transfer an employee under their own team" },
      { status: 400 }
    );
  }
  if (
    !seesEverything(session.role) &&
    newManager.id !== session.sub &&
    !newManager.ancestorIds.includes(session.sub)
  ) {
    return NextResponse.json({ error: "The new manager is outside your team" }, { status: 403 });
  }

  // Rebuild ancestor paths: target first, then BFS through the subtree.
  const newTargetAncestors = [...newManager.ancestorIds, newManager.id];
  const subtree = await prisma.user.findMany({
    where: { ancestorIds: { has: target.id } },
    select: { id: true, managerId: true, ancestorIds: true },
  });

  const childrenOf = new Map<string, typeof subtree>();
  for (const member of subtree) {
    if (!member.managerId) continue;
    const list = childrenOf.get(member.managerId) ?? [];
    list.push(member);
    childrenOf.set(member.managerId, list);
  }

  const updates: { id: string; ancestorIds: string[] }[] = [
    { id: target.id, ancestorIds: newTargetAncestors },
  ];
  const queue: { id: string; ancestorIds: string[] }[] = [
    { id: target.id, ancestorIds: newTargetAncestors },
  ];
  while (queue.length > 0) {
    const parent = queue.shift()!;
    for (const child of childrenOf.get(parent.id) ?? []) {
      const path = [...parent.ancestorIds, parent.id];
      updates.push({ id: child.id, ancestorIds: path });
      queue.push({ id: child.id, ancestorIds: path });
    }
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: target.id }, data: { managerId: newManager.id } }),
    ...updates.map((u) =>
      prisma.user.update({ where: { id: u.id }, data: { ancestorIds: u.ancestorIds } })
    ),
  ]);

  await logActivity({
    actorId: session.sub,
    action: "EMPLOYEE_TRANSFERRED",
    targetType: "USER",
    targetId: target.id,
    summary: `transferred ${target.name} to ${newManager.name}'s team`,
    metadata: { from: target.managerId, to: newManager.id, subtreeSize: updates.length },
  });

  return NextResponse.json({ ok: true, moved: updates.length });
}
