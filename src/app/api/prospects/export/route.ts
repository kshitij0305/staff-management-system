import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { buildProspectWhere } from "@/features/prospects/query";
import { PROSPECT_STATUS_LABELS } from "@/lib/constants";
import { format } from "date-fns";

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** CSV export honouring the same filters (and role scope) as the list view. */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const url = new URL(req.url);
  const where = buildProspectWhere(session, url.searchParams);

  const rows = await prisma.prospect.findMany({
    where,
    orderBy: { visitDate: "desc" },
    take: 5000,
    select: {
      customerName: true,
      phone: true,
      address: true,
      city: true,
      state: true,
      visitDate: true,
      status: true,
      remarks: true,
      collectedBy: { select: { name: true, employeeId: true } },
    },
  });

  const header = [
    "Customer Name",
    "Phone",
    "Address",
    "City",
    "State",
    "Visit Date",
    "Status",
    "Remarks",
    "Collected By",
    "Employee ID",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.customerName,
        r.phone,
        r.address,
        r.city,
        r.state,
        format(r.visitDate, "yyyy-MM-dd"),
        PROSPECT_STATUS_LABELS[r.status],
        r.remarks ?? "",
        r.collectedBy.name,
        r.collectedBy.employeeId,
      ]
        .map((v) => csvCell(String(v)))
        .join(",")
    );
  }

  return new Response("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="prospects-${format(new Date(), "yyyy-MM-dd")}.csv"`,
    },
  });
}
