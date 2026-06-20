import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { buildProspectWhere } from "@/features/prospects/query";
import { getFieldDefs } from "@/features/fields/server";
import { customValueToText } from "@/features/fields/display";
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

  const [rows, defs] = await Promise.all([
    prisma.prospect.findMany({
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
        customFields: true,
        collectedBy: { select: { name: true, employeeId: true } },
      },
    }),
    getFieldDefs(session.orgId),
  ]);

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
    ...defs.map((d) => d.label),
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    const custom = (r.customFields ?? {}) as Record<string, unknown>;
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
        ...defs.map((d) => customValueToText(d, custom[d.key])),
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
