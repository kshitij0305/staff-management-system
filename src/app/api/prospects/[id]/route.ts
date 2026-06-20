import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { seesEverything } from "@/lib/rbac";
import { updateProspectSchema } from "@/features/prospects/schemas";
import { resolveCustomFields } from "@/features/fields/server";
import { logActivity } from "@/features/activity/log";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const prospect = await prisma.prospect.findFirst({
    where: { id, organizationId: session.orgId },
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
    seesEverything(session) ||
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

  // When custom values are sent, validate the full set against the org's defs and replace.
  let customFields: Prisma.InputJsonObject | undefined;
  if (input.customFields !== undefined) {
    const custom = await resolveCustomFields(session.orgId, input.customFields);
    if (!custom.ok) return NextResponse.json({ error: custom.error }, { status: 400 });
    customFields = custom.values;
  }

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
      ...(customFields !== undefined ? { customFields } : {}),
    },
    select: { id: true, customerName: true, status: true },
  });

  await logActivity({
    organizationId: session.orgId,
    actorId: session.sub,
    action: "PROSPECT_UPDATED",
    targetType: "PROSPECT",
    targetId: updated.id,
    summary: `updated prospect ${updated.customerName}`,
    metadata: input.status ? { status: input.status } : undefined,
  });

  return NextResponse.json({ prospect: updated });
}
