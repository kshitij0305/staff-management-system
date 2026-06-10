"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function TrendChart({ data }: { data: { label: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -22 }}>
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={28}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
        />
        <Tooltip
          content={({ active, payload }) =>
            active && payload?.length ? (
              <div className="rounded-lg border bg-popover px-3 py-1.5 text-xs shadow-md">
                <div className="font-medium">{payload[0].payload.label}</div>
                <div className="mt-0.5 text-muted-foreground">
                  <span className="font-semibold text-foreground tabular-nums">
                    {payload[0].value}
                  </span>{" "}
                  prospects
                </div>
              </div>
            ) : null
          }
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--chart-1)"
          strokeWidth={2}
          fill="url(#trend-fill)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
