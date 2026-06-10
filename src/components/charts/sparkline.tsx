"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";

export interface SparkPoint {
  label: string;
  value: number;
}

export function Sparkline({
  data,
  color = "var(--chart-1)",
  height = 56,
}: {
  data: SparkPoint[];
  color?: string;
  height?: number;
}) {
  const gradientId = `spark-${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip
          cursor={{ stroke: "var(--border)" }}
          content={({ active, payload }) =>
            active && payload?.length ? (
              <div className="rounded-md border bg-popover px-2 py-1 text-xs shadow-md">
                <span className="font-medium">{payload[0].payload.label}</span>
                <span className="ml-2 tabular-nums">{payload[0].value}</span>
              </div>
            ) : null
          }
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
