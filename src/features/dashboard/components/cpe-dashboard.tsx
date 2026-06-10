import Link from "next/link";
import { format } from "date-fns";
import { CalendarCheck, CalendarRange, Flame, Percent, Sun } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProspectStatusBadge } from "@/components/badges";
import { Sparkline } from "@/components/charts/sparkline";
import { EmptyState } from "@/components/empty-state";
import { ContactRound } from "lucide-react";
import type { CpeData } from "../data";
import { KpiCard } from "./kpi-card";
import { QuickAddProspect } from "./quick-add-prospect";

export function CpeDashboard({ data, firstName }: { data: CpeData; firstName: string }) {
  return (
    <div className="space-y-4">
      {/* hero */}
      <Card className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(50% 80% at 85% 20%, color-mix(in oklch, var(--primary) 14%, transparent) 0%, transparent 70%)",
          }}
        />
        <CardContent className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sun className="size-4 text-primary" />
              {format(new Date(), "EEEE, d MMMM")}
            </div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">
              Ready for today&apos;s visits, {firstName}?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.today === 0
                ? "No prospects logged today yet — your first one is a tap away."
                : `${data.today} prospect${data.today === 1 ? "" : "s"} logged today. Keep going!`}
            </p>
          </div>
          <QuickAddProspect />
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard index={0} label="Today" value={data.today} icon={CalendarCheck} />
        <KpiCard index={1} label="This week" value={data.week} icon={CalendarRange} />
        <KpiCard index={2} label="Interest rate · 30d" value={data.interestRate30} suffix="%" icon={Percent} />
        <KpiCard index={3} label="Day streak" value={data.streak} icon={Flame} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">My prospects — last 14 days</CardTitle>
          </CardHeader>
          <CardContent>
            <Sparkline data={data.trend14} height={180} />
          </CardContent>
        </Card>

        {/* recent */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-sm">Recent submissions</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/prospects">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {data.recent.length === 0 ? (
              <EmptyState
                icon={<ContactRound />}
                title="Nothing here yet"
                description="Prospects you add will show up here."
                className="border-0 py-8"
              />
            ) : (
              data.recent.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-lg p-2">
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="truncate text-sm font-medium">{p.customerName}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.city} · {format(p.visitDate, "d MMM")}
                    </div>
                  </div>
                  <ProspectStatusBadge status={p.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
