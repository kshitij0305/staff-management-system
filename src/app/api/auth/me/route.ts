import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
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
      manager: { select: { id: true, name: true, role: true } },
    },
  });
  if (!user || user.status === "INACTIVE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ user });
}
