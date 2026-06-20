import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { validateCustomFields, type FieldDef } from "./schemas";

/** Load an org's field definitions (typed for form/validation use). */
export async function getFieldDefs(orgId: string): Promise<FieldDef[]> {
  return prisma.fieldDefinition.findMany({
    where: { orgId },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { id: true, key: true, label: true, type: true, options: true, required: true, order: true },
  });
}

/**
 * Validate a raw custom-field payload against the org's definitions. Returns the
 * cleaned values to persist, or a user-facing error. Org isolation: defs are
 * always loaded by `orgId`, so one tenant's fields never validate another's data.
 */
export async function resolveCustomFields(
  orgId: string,
  raw: unknown
): Promise<{ ok: true; values: Prisma.InputJsonObject } | { ok: false; error: string }> {
  const defs = await getFieldDefs(orgId);
  if (defs.length === 0) return { ok: true, values: {} };
  return validateCustomFields(defs, raw);
}
