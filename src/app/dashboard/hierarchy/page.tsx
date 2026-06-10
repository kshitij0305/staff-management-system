import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scopedUserWhere } from "@/lib/rbac";
import { OrgChart } from "@/features/hierarchy/components/org-chart";

export const metadata: Metadata = { title: "Hierarchy" };

export default async function HierarchyPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "CPE") redirect("/dashboard");

  const users = await prisma.user.findMany({
    where: scopedUserWhere(session),
    select: {
      id: true,
      name: true,
      role: true,
      status: true,
      managerId: true,
      _count: { select: { prospects: true, reports: true } },
    },
  });

  const inScope = new Set(users.map((u) => u.id));
  const orgUsers = users.map((u) => ({
    id: u.id,
    name: u.name,
    role: u.role,
    status: u.status,
    // Treat managers outside the visible scope as roots (e.g. an ASM viewing their own subtree)
    managerId: u.managerId && inScope.has(u.managerId) ? u.managerId : null,
    prospectCount: u._count.prospects,
    reportCount: u._count.reports,
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Organization</h2>
        <p className="text-sm text-muted-foreground">
          Drag to pan, scroll to zoom, click the badge under a card to expand or collapse a team.
        </p>
      </div>
      <OrgChart users={orgUsers} viewerId={session.sub} />
    </div>
  );
}
