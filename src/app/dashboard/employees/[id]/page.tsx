import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { format, formatDistanceToNow, subDays, startOfDay } from "date-fns";
import { Mail, Phone, MapPin, CalendarDays, ArrowLeft, Users, ContactRound } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scopedUserWhere, canManageUser } from "@/lib/rbac";
import { ROLE_LABELS } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RoleBadge, EmployeeStatusBadge, ProspectStatusBadge } from "@/components/badges";
import { UserAvatar } from "@/components/user-avatar";
import { Sparkline } from "@/components/charts/sparkline";
import { EmptyState } from "@/components/empty-state";
import { EditProfileButton } from "@/features/employees/components/edit-profile-button";

export default async function EmployeeProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;

  const employee = await prisma.user.findFirst({
    // scopedUserWhere already includes the viewer themselves; `{}` for executives = see all.
    where: { AND: [{ id }, scopedUserWhere(session)] },
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
      ancestorIds: true,
      manager: { select: { id: true, name: true, role: true } },
      reports: {
        select: {
          id: true,
          name: true,
          role: true,
          status: true,
          _count: { select: { prospects: true } },
        },
        orderBy: { name: "asc" },
      },
    },
  });
  if (!employee) notFound();

  const canManage = canManageUser(session, {
    id: employee.id,
    role: employee.role,
    ancestorIds: employee.ancestorIds,
  });

  const isCPE = employee.role === "CPE";
  // Prospects collected by this person, or — for managers — by anyone in their subtree.
  const prospectScope = isCPE
    ? { collectedById: employee.id }
    : {
        OR: [
          { collectedById: employee.id },
          { collectedBy: { is: { ancestorIds: { has: employee.id } } } },
        ],
      };

  const since30 = subDays(new Date(), 30);
  const since14 = startOfDay(subDays(new Date(), 13));

  const [total, last30, interested30, recentProspects, trendRows, recentActivity] =
    await Promise.all([
      prisma.prospect.count({ where: prospectScope }),
      prisma.prospect.count({ where: { AND: [prospectScope, { visitDate: { gte: since30 } }] } }),
      prisma.prospect.count({
        where: { AND: [prospectScope, { visitDate: { gte: since30 }, status: "INTERESTED" }] },
      }),
      prisma.prospect.findMany({
        where: prospectScope,
        orderBy: { visitDate: "desc" },
        take: 6,
        select: {
          id: true,
          customerName: true,
          city: true,
          status: true,
          visitDate: true,
          collectedBy: { select: { name: true } },
        },
      }),
      prisma.prospect.findMany({
        where: { AND: [prospectScope, { visitDate: { gte: since14 } }] },
        select: { visitDate: true },
      }),
      prisma.activityLog.findMany({
        where: { actorId: employee.id },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, summary: true, createdAt: true },
      }),
    ]);

  // 14-day daily trend
  const trend = Array.from({ length: 14 }, (_, i) => {
    const day = startOfDay(subDays(new Date(), 13 - i));
    return { label: format(day, "d MMM"), value: 0, key: format(day, "yyyy-MM-dd") };
  });
  const trendByKey = new Map(trend.map((t) => [t.key, t]));
  for (const row of trendRows) {
    const key = format(row.visitDate, "yyyy-MM-dd");
    const bucket = trendByKey.get(key);
    if (bucket) bucket.value += 1;
  }

  const interestRate = last30 === 0 ? 0 : Math.round((interested30 / last30) * 100);

  const stats = [
    { label: "Total prospects", value: total.toLocaleString("en-IN") },
    { label: "Last 30 days", value: last30.toLocaleString("en-IN") },
    { label: "Interest rate (30d)", value: `${interestRate}%` },
    ...(isCPE
      ? []
      : [{ label: "Direct reports", value: employee.reports.length.toLocaleString("en-IN") }]),
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
        <Link href="/dashboard/employees">
          <ArrowLeft className="size-4" /> Employees
        </Link>
      </Button>

      {/* header */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-5">
          <UserAvatar name={employee.name} className="size-16" textClassName="text-xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight">{employee.name}</h2>
              <RoleBadge role={employee.role} />
              <EmployeeStatusBadge status={employee.status} />
            </div>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Mail className="size-3.5" /> {employee.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="size-3.5" /> {employee.phone}
              </span>
              {(employee.city || employee.state) && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  {[employee.city, employee.state].filter(Boolean).join(", ")}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5" />
                Joined {format(employee.joiningDate, "d MMM yyyy")}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 text-right">
            {canManage && (
              <EditProfileButton
                employee={{
                  id: employee.id,
                  employeeId: employee.employeeId,
                  name: employee.name,
                  email: employee.email,
                  phone: employee.phone,
                  role: employee.role,
                  status: employee.status,
                  joiningDate: employee.joiningDate.toISOString(),
                  city: employee.city,
                  state: employee.state,
                  manager: employee.manager
                    ? { id: employee.manager.id, name: employee.manager.name }
                    : null,
                  _count: { reports: employee.reports.length, prospects: 0 },
                }}
              />
            )}
            <div className="font-mono text-sm text-muted-foreground">{employee.employeeId}</div>
            {employee.manager && (
              <div className="text-xs text-muted-foreground">
                Reports to{" "}
                <Link
                  href={`/dashboard/employees/${employee.manager.id}`}
                  className="font-medium text-foreground hover:text-primary"
                >
                  {employee.manager.name}
                </Link>{" "}
                ({ROLE_LABELS[employee.manager.role]})
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* stats + trend */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="grid grid-cols-2 gap-4 lg:col-span-1">
          {stats.map((s) => (
            <Card key={s.label} className="gap-1 py-4">
              <CardContent className="px-4">
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                  {s.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">
              {isCPE ? "Prospects collected" : "Team prospects"} — last 14 days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Sparkline data={trend} height={120} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* team */}
        {!isCPE && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Users className="size-4 text-muted-foreground" /> Team ({employee.reports.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {employee.reports.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No direct reports yet.
                </p>
              ) : (
                employee.reports.map((r) => (
                  <Link
                    key={r.id}
                    href={`/dashboard/employees/${r.id}`}
                    className="flex items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-muted"
                  >
                    <UserAvatar name={r.name} />
                    <div className="min-w-0 flex-1 leading-tight">
                      <div className="truncate text-sm font-medium">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{ROLE_LABELS[r.role]}</div>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {r._count.prospects} prospects
                    </span>
                    <EmployeeStatusBadge status={r.status} />
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* recent prospects */}
        <Card className={isCPE ? "lg:col-span-2" : undefined}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <ContactRound className="size-4 text-muted-foreground" /> Recent prospects
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {recentProspects.length === 0 ? (
              <EmptyState
                icon={<ContactRound />}
                title="No prospects yet"
                description="Prospects collected by this employee will show up here."
                className="border-0 py-8"
              />
            ) : (
              recentProspects.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-lg p-2">
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="truncate text-sm font-medium">{p.customerName}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.city} · {format(p.visitDate, "d MMM")}
                      {!isCPE && ` · by ${p.collectedBy.name}`}
                    </div>
                  </div>
                  <ProspectStatusBadge status={p.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* recent activity */}
        <Card className={isCPE ? "lg:col-span-2" : "lg:col-span-2"}>
          <CardHeader>
            <CardTitle className="text-sm">Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {recentActivity.map((a) => (
                  <li key={a.id} className="flex items-baseline gap-2 text-sm">
                    <span className="size-1.5 shrink-0 translate-y-[-1px] rounded-full bg-primary" />
                    <span className="min-w-0 flex-1">
                      <span className="font-medium">{employee.name.split(" ")[0]}</span>{" "}
                      <span className="text-muted-foreground">{a.summary}</span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDistanceToNow(a.createdAt, { addSuffix: true })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
