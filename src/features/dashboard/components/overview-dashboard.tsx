"use client";

import Link from "next/link";
import { Users, ContactRound, CalendarRange, Percent } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RoleBadge, EmployeeStatusBadge } from "@/components/badges";
import { UserAvatar } from "@/components/user-avatar";
import type { EmployeeStatus } from "@prisma/client";
import type { OverviewData } from "../data";
import { KpiCard } from "./kpi-card";
import { TrendChart } from "./trend-chart";
import { StatusDonut } from "./status-donut";
import { StateBars } from "./state-bars";
import { Leaderboard } from "./leaderboard";
import { ActivityFeed } from "./activity-feed";

export function OverviewDashboard({
  data,
  variant,
}: {
  data: OverviewData;
  /** executive = Chairman / National Head · manager = CSM / ASM */
  variant: "executive" | "manager";
}) {
  const delta7 =
    data.prospectsPrev7 === 0
      ? data.prospects7 > 0
        ? 100
        : 0
      : Math.round(((data.prospects7 - data.prospectsPrev7) / data.prospectsPrev7) * 100);

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard
          index={0}
          label={variant === "executive" ? "Active employees" : "Team members"}
          value={data.activeEmployees - 1}
          icon={Users}
        />
        <KpiCard
          index={1}
          label="Prospects · 7 days"
          value={data.prospects7}
          delta={delta7}
          deltaLabel="vs previous week"
          icon={ContactRound}
        />
        <KpiCard index={2} label="Prospects · 30 days" value={data.prospects30} icon={CalendarRange} />
        <KpiCard index={3} label="Interest rate · 30d" value={data.interestRate30} suffix="%" icon={Percent} />
      </div>

      {/* trend + donut */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Prospects collected — last 30 days</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart data={data.trend30} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">By status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusDonut data={data.statusSplit} />
          </CardContent>
        </Card>
      </div>

      {/* leaderboards / team */}
      <div className="grid gap-4 lg:grid-cols-3">
        {variant === "executive" ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Top ASMs · 30 days</CardTitle>
              </CardHeader>
              <CardContent>
                <Leaderboard rows={data.topAsms} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Top CPEs · 30 days</CardTitle>
              </CardHeader>
              <CardContent>
                <Leaderboard rows={data.topCpes} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">By state · 30 days</CardTitle>
              </CardHeader>
              <CardContent>
                <StateBars data={data.byState} />
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card className="lg:col-span-2">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-sm">Team performance · 30 days</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/employees">View all</Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-1">
                {data.team.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No direct reports yet.
                  </p>
                ) : (
                  data.team.map((m) => (
                    <Link
                      key={m.id}
                      href={`/dashboard/employees/${m.id}`}
                      className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
                    >
                      <UserAvatar name={m.name} />
                      <div className="min-w-0 flex-1 leading-tight">
                        <div className="truncate text-sm font-medium">{m.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {m.interested30} interested
                        </div>
                      </div>
                      <RoleBadge role={m.role} />
                      <EmployeeStatusBadge status={m.status as EmployeeStatus} />
                      <span className="w-12 text-right text-sm font-semibold tabular-nums">
                        {m.count30}
                      </span>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Team leaderboard</CardTitle>
              </CardHeader>
              <CardContent>
                <Leaderboard rows={data.topCpes.length > 0 ? data.topCpes : data.topAsms} />
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* activity */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-sm">Recent activity</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/activity">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <ActivityFeed rows={data.activity} />
        </CardContent>
      </Card>
    </div>
  );
}
