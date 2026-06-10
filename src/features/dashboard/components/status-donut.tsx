"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { ProspectStatus } from "@prisma/client";
import { PROSPECT_STATUS_HEX, PROSPECT_STATUS_LABELS } from "@/lib/constants";

export function StatusDonut({ data }: { data: { status: ProspectStatus; count: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const chartData = data.map((d) => ({
    name: PROSPECT_STATUS_LABELS[d.status],
    value: d.count,
    color: PROSPECT_STATUS_HEX[d.status],
  }));

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <div className="rounded-lg border bg-popover px-3 py-1.5 text-xs shadow-md">
                    <span className="font-medium">{payload[0].name}</span>
                    <span className="ml-2 tabular-nums">{payload[0].value}</span>
                  </div>
                ) : null
              }
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={56}
              outerRadius={78}
              paddingAngle={3}
              cornerRadius={4}
              strokeWidth={0}
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular-nums">{total.toLocaleString("en-IN")}</span>
          <span className="text-[10px] tracking-wide text-muted-foreground uppercase">30 days</span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
        {chartData.map((d) => (
          <span key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-2 rounded-full" style={{ background: d.color }} />
            {d.name}
            <span className="font-medium text-foreground tabular-nums">{d.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
