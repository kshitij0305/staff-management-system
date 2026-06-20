import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findFirst({
    where: { id: session.sub, organizationId: session.orgId },
    select: {
      id: true,
      employeeId: true,
      name: true,
      email: true,
      phone: true,
      level: { select: { name: true, rank: true, seesAll: true } },
      status: true,
      joiningDate: true,
      city: true,
      state: true,
      manager: { select: { id: true, name: true, level: { select: { name: true } } } },
    },
  });
  if (!user || user.status === "INACTIVE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ user });
}
