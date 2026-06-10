import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { scopedActivityWhere } from "@/lib/rbac";

const TYPE_FILTERS: Record<string, string[]> = {
  EMPLOYEES: [
    "EMPLOYEE_CREATED",
    "EMPLOYEE_UPDATED",
    "EMPLOYEE_DEACTIVATED",
    "EMPLOYEE_REACTIVATED",
    "EMPLOYEE_TRANSFERRED",
  ],
  PROSPECTS: ["PROSPECT_ADDED", "PROSPECT_UPDATED"],
  LOGINS: ["USER_LOGIN"],
};

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize")) || 25));

  const where: Prisma.ActivityLogWhereInput = {
    AND: [
      scopedActivityWhere(session),
      type && TYPE_FILTERS[type] ? { action: { in: TYPE_FILTERS[type] } } : {},
    ],
  };

  const [total, logs] = await Promise.all([
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        action: true,
        summary: true,
        createdAt: true,
        actor: { select: { id: true, name: true, role: true } },
      },
    }),
  ]);

  return NextResponse.json({ logs, total, page, pageSize });
}
