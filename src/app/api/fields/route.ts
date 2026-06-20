import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createFieldSchema, slugifyKey } from "@/features/fields/schemas";

/** List the org's custom field definitions (any signed-in member — needed to render forms). */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const fields = await prisma.fieldDefinition.findMany({
    where: { orgId: session.orgId },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ fields });
}

/** Define a new custom field. Owner (top-level) only. */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.seesAll) {
    return NextResponse.json({ error: "Only an owner can manage custom fields" }, { status: 403 });
  }

  const parsed = createFieldSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const input = parsed.data;

  const key = slugifyKey(input.label);
  if (!key) return NextResponse.json({ error: "Give the field a usable name" }, { status: 400 });

  const last = await prisma.fieldDefinition.findFirst({
    where: { orgId: session.orgId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  try {
    const field = await prisma.fieldDefinition.create({
      data: {
        orgId: session.orgId,
        key,
        label: input.label,
        type: input.type,
        options: input.type === "SELECT" ? input.options : [],
        required: input.required,
        order: (last?.order ?? -1) + 1,
      },
    });
    return NextResponse.json({ field }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "A field with this name already exists" }, { status: 409 });
    }
    throw err;
  }
}
