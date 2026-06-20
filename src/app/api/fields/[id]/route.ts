import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { updateFieldSchema } from "@/features/fields/schemas";

type Params = { params: Promise<{ id: string }> };

/** Edit a field's label/options/required/order. Owner only. Type and key are immutable. */
export async function PATCH(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.seesAll) {
    return NextResponse.json({ error: "Only an owner can manage custom fields" }, { status: 403 });
  }
  const { id } = await params;

  // Org-scoped gate before mutating by id.
  const field = await prisma.fieldDefinition.findFirst({
    where: { id, orgId: session.orgId },
    select: { id: true, type: true },
  });
  if (!field) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = updateFieldSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const input = parsed.data;

  // Options only apply to dropdowns, and a dropdown still needs at least two.
  if (input.options !== undefined) {
    if (field.type !== "SELECT") {
      return NextResponse.json({ error: "Only a dropdown has options" }, { status: 400 });
    }
    if (input.options.length < 2) {
      return NextResponse.json({ error: "A dropdown needs at least two options" }, { status: 400 });
    }
  }

  const updated = await prisma.fieldDefinition.update({
    where: { id },
    data: {
      ...(input.label !== undefined ? { label: input.label } : {}),
      ...(input.options !== undefined ? { options: input.options } : {}),
      ...(input.required !== undefined ? { required: input.required } : {}),
      ...(input.order !== undefined ? { order: input.order } : {}),
    },
  });
  return NextResponse.json({ field: updated });
}

/**
 * Remove a field definition. Owner only. Existing prospect values are left
 * untouched — orphaned JSON keys are simply ignored on read.
 */
export async function DELETE(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.seesAll) {
    return NextResponse.json({ error: "Only an owner can manage custom fields" }, { status: 403 });
  }
  const { id } = await params;

  const field = await prisma.fieldDefinition.findFirst({
    where: { id, orgId: session.orgId },
    select: { id: true },
  });
  if (!field) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.fieldDefinition.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
