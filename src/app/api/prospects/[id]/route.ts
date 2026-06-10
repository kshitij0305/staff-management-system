import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { seesEverything } from "@/lib/rbac";
import { updateProspectSchema } from "@/features/prospects/schemas";
import { logActivity } from "@/features/activity/log";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const prospect = await prisma.prospect.findUnique({
    where: { id },
    select: {
      id: true,
      customerName: true,
      collectedById: true,
      collectedBy: { select: { ancestorIds: true } },
    },
  });
  if (!prospect) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Editable by the collector or anyone above them in the chain.
  const allowed =
    seesEverything(session.role) ||
    prospect.collectedById === session.sub ||
    prospect.collectedBy.ancestorIds.includes(session.sub);
  if (!allowed) {
    return NextResponse.json({ error: "You cannot edit this prospect" }, { status: 403 });
  }

  const parsed = updateProspectSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const input = parsed.data;

  const updated = await prisma.prospect.update({
    where: { id },
    data: {
      ...(input.customerName ? { customerName: input.customerName } : {}),
      ...(input.phone ? { phone: input.phone } : {}),
      ...(input.address ? { address: input.address } : {}),
      ...(input.city ? { city: input.city } : {}),
      ...(input.state ? { state: input.state } : {}),
      ...(input.visitDate ? { visitDate: input.visitDate } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.remarks !== undefined ? { remarks: input.remarks || null } : {}),
    },
    select: { id: true, customerName: true, status: true },
  });

  await logActivity({
    actorId: session.sub,
    action: "PROSPECT_UPDATED",
    targetType: "PROSPECT",
    targetId: updated.id,
    summary: `updated prospect ${updated.customerName}`,
    metadata: input.status ? { status: input.status } : undefined,
  });

  return NextResponse.json({ prospect: updated });
}
