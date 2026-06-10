import { format, startOfDay, subDays, isSameDay } from "date-fns";
import { ProspectStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SessionPayload } from "@/lib/auth";
import { scopedActivityWhere, scopedProspectWhere, scopedUserWhere } from "@/lib/rbac";

export interface LeaderRow {
  id: string;
  name: string;
  role: Role;
  count: number;
  interested: number;
}

export interface TeamMemberRow {
  id: string;
  name: string;
  role: Role;
  status: string;
  count30: number;
  interested30: number;
}

export interface ActivityRow {
  id: string;
  actorName: string;
  action: string;
  summary: string;
  createdAt: Date;
}

export interface OverviewData {
  totalEmployees: number;
  activeEmployees: number;
  prospects7: number;
  prospectsPrev7: number;
  prospects30: number;
  interestRate30: number;
  trend30: { label: string; value: number }[];
  statusSplit: { status: ProspectStatus; count: number }[];
  byState: { state: string; count: number }[];
  topCpes: LeaderRow[];
  topAsms: LeaderRow[];
  team: TeamMemberRow[];
  activity: ActivityRow[];
}

export async function getOverviewData(session: SessionPayload): Promise<OverviewData> {
  const now = new Date();
  const since37 = startOfDay(subDays(now, 36)); // 30d trend + previous-7d delta window

  const [users, prospects, activity] = await Promise.all([
    prisma.user.findMany({
      where: scopedUserWhere(session),
      select: { id: true, name: true, role: true, status: true, managerId: true },
    }),
    prisma.prospect.findMany({
      where: { AND: [scopedProspectWhere(session), { visitDate: { gte: since37 } }] },
      select: { visitDate: true, status: true, collectedById: true, state: true },
    }),
    prisma.activityLog.findMany({
      where: scopedActivityWhere(session),
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        action: true,
        summary: true,
        createdAt: true,
        actor: { select: { name: true } },
      },
    }),
  ]);

  const userById = new Map(users.map((u) => [u.id, u]));
  const d7 = startOfDay(subDays(now, 6));
  const d14 = startOfDay(subDays(now, 13));
  const d30 = startOfDay(subDays(now, 29));

  let prospects7 = 0;
  let prospectsPrev7 = 0;
  let prospects30 = 0;
  let interested30 = 0;

  const trendBuckets = Array.from({ length: 30 }, (_, i) => {
    const day = startOfDay(subDays(now, 29 - i));
    return { key: format(day, "yyyy-MM-dd"), label: format(day, "d MMM"), value: 0 };
  });
  const trendByKey = new Map(trendBuckets.map((b) => [b.key, b]));

  const statusCount = new Map<ProspectStatus, number>();
  const stateCount = new Map<string, number>();
  const byCpe = new Map<string, { count: number; interested: number }>();
  const byAsm = new Map<string, { count: number; interested: number }>();

  for (const p of prospects) {
    const isInterested = p.status === ProspectStatus.INTERESTED;
    if (p.visitDate >= d7) prospects7 += 1;
    else if (p.visitDate >= d14) prospectsPrev7 += 1;

    if (p.visitDate >= d30) {
      prospects30 += 1;
      if (isInterested) interested30 += 1;

      const bucket = trendByKey.get(format(p.visitDate, "yyyy-MM-dd"));
      if (bucket) bucket.value += 1;

      statusCount.set(p.status, (statusCount.get(p.status) ?? 0) + 1);
      stateCount.set(p.state, (stateCount.get(p.state) ?? 0) + 1);

      const collector = userById.get(p.collectedById);
      if (collector) {
        const cpe = byCpe.get(collector.id) ?? { count: 0, interested: 0 };
        cpe.count += 1;
        if (isInterested) cpe.interested += 1;
        byCpe.set(collector.id, cpe);

        if (collector.managerId) {
          const asm = byAsm.get(collector.managerId) ?? { count: 0, interested: 0 };
          asm.count += 1;
          if (isInterested) asm.interested += 1;
          byAsm.set(collector.managerId, asm);
        }
      }
    }
  }

  const toLeaders = (map: Map<string, { count: number; interested: number }>): LeaderRow[] =>
    [...map.entries()]
      .map(([id, stats]) => {
        const u = userById.get(id);
        return u ? { id, name: u.name, role: u.role, ...stats } : null;
      })
      .filter((row): row is LeaderRow => row !== null)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

  // Direct reports performance (for ASM/CSM team table)
  const team: TeamMemberRow[] = users
    .filter((u) => u.managerId === session.sub)
    .map((u) => ({
      id: u.id,
      name: u.name,
      role: u.role,
      status: u.status,
      count30: byCpe.get(u.id)?.count ?? byAsm.get(u.id)?.count ?? 0,
      interested30: byCpe.get(u.id)?.interested ?? byAsm.get(u.id)?.interested ?? 0,
    }))
    .sort((a, b) => b.count30 - a.count30);

  return {
    totalEmployees: users.length,
    activeEmployees: users.filter((u) => u.status === "ACTIVE").length,
    prospects7,
    prospectsPrev7,
    prospects30,
    interestRate30: prospects30 === 0 ? 0 : Math.round((interested30 / prospects30) * 100),
    trend30: trendBuckets.map(({ label, value }) => ({ label, value })),
    statusSplit: [...statusCount.entries()].map(([status, count]) => ({ status, count })),
    byState: [...stateCount.entries()]
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
    topCpes: toLeaders(byCpe).filter((l) => l.role === Role.CPE),
    topAsms: toLeaders(byAsm),
    team,
    activity: activity.map((a) => ({
      id: a.id,
      actorName: a.actor.name,
      action: a.action,
      summary: a.summary,
      createdAt: a.createdAt,
    })),
  };
}

export interface CpeData {
  today: number;
  week: number;
  month: number;
  interestRate30: number;
  streak: number;
  trend14: { label: string; value: number }[];
  recent: {
    id: string;
    customerName: string;
    city: string;
    status: ProspectStatus;
    visitDate: Date;
  }[];
}

export async function getCpeData(session: SessionPayload): Promise<CpeData> {
  const now = new Date();
  const since60 = startOfDay(subDays(now, 59));

  const prospects = await prisma.prospect.findMany({
    where: { collectedById: session.sub, visitDate: { gte: since60 } },
    orderBy: { visitDate: "desc" },
    select: { id: true, customerName: true, city: true, status: true, visitDate: true },
  });

  const d7 = startOfDay(subDays(now, 6));
  const d30 = startOfDay(subDays(now, 29));

  let today = 0;
  let week = 0;
  let month = 0;
  let interested30 = 0;

  const trend = Array.from({ length: 14 }, (_, i) => {
    const day = startOfDay(subDays(now, 13 - i));
    return { key: format(day, "yyyy-MM-dd"), label: format(day, "d MMM"), value: 0 };
  });
  const trendByKey = new Map(trend.map((t) => [t.key, t]));
  const daysWithProspects = new Set<string>();

  for (const p of prospects) {
    if (isSameDay(p.visitDate, now)) today += 1;
    if (p.visitDate >= d7) week += 1;
    if (p.visitDate >= d30) {
      month += 1;
      if (p.status === ProspectStatus.INTERESTED) interested30 += 1;
    }
    const key = format(p.visitDate, "yyyy-MM-dd");
    daysWithProspects.add(key);
    const bucket = trendByKey.get(key);
    if (bucket) bucket.value += 1;
  }

  // Streak: consecutive days with at least one visit, ending today or yesterday.
  let streak = 0;
  let cursor = daysWithProspects.has(format(now, "yyyy-MM-dd")) ? now : subDays(now, 1);
  while (daysWithProspects.has(format(cursor, "yyyy-MM-dd"))) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }

  return {
    today,
    week,
    month,
    interestRate30: month === 0 ? 0 : Math.round((interested30 / month) * 100),
    streak,
    trend14: trend.map(({ label, value }) => ({ label, value })),
    recent: prospects.slice(0, 6),
  };
}
