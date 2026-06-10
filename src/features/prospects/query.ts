import { Prisma, ProspectStatus } from "@prisma/client";
import { scopedProspectWhere } from "@/lib/rbac";
import type { SessionPayload } from "@/lib/auth";

/** Build the Prospect where-clause from list/export query params (shared by both routes). */
export function buildProspectWhere(
  session: SessionPayload,
  params: URLSearchParams
): Prisma.ProspectWhereInput {
  const q = params.get("q")?.trim();
  const status = params.get("status");
  const employeeId = params.get("employeeId");
  const from = params.get("from");
  const to = params.get("to");

  const visitDate: Prisma.DateTimeFilter = {};
  if (from && !isNaN(Date.parse(from))) visitDate.gte = new Date(from);
  if (to && !isNaN(Date.parse(to))) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    visitDate.lte = end;
  }

  return {
    AND: [
      scopedProspectWhere(session),
      status && Object.values(ProspectStatus).includes(status as ProspectStatus)
        ? { status: status as ProspectStatus }
        : {},
      employeeId ? { collectedById: employeeId } : {},
      Object.keys(visitDate).length > 0 ? { visitDate } : {},
      q
        ? {
            OR: [
              { customerName: { contains: q, mode: "insensitive" as const } },
              { phone: { contains: q } },
              { city: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {},
    ],
  };
}
