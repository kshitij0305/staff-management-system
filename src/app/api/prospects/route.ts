import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createProspectSchema } from "@/features/prospects/schemas";
import { buildProspectWhere } from "@/features/prospects/query";
import { logActivity } from "@/features/activity/log";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize")) || 20));
  const where = buildProspectWhere(session, url.searchParams);

  const [total, prospects] = await Promise.all([
    prisma.prospect.count({ where }),
    prisma.prospect.findMany({
      where,
      orderBy: { visitDate: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        customerName: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        visitDate: true,
        status: true,
        remarks: true,
        createdAt: true,
        collectedBy: { select: { id: true, name: true, employeeId: true } },
      },
    }),
  ]);

  return NextResponse.json({ prospects, total, page, pageSize });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createProspectSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const input = parsed.data;

  const prospect = await prisma.prospect.create({
    data: {
      customerName: input.customerName,
      phone: input.phone,
      address: input.address,
      city: input.city,
      state: input.state,
      visitDate: input.visitDate,
      status: input.status,
      remarks: input.remarks || null,
      collectedById: session.sub,
    },
    select: { id: true, customerName: true, city: true },
  });

  await logActivity({
    actorId: session.sub,
    action: "PROSPECT_ADDED",
    targetType: "PROSPECT",
    targetId: prospect.id,
    summary: `added prospect ${prospect.customerName} (${prospect.city})`,
  });

  return NextResponse.json({ prospect }, { status: 201 });
}
