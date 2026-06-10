"use client";

import { motion } from "framer-motion";

/** Horizontal "by state" bars — simple divs animate nicer than a full chart here. */
export function StateBars({ data }: { data: { state: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="space-y-3">
      {data.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">No data yet.</p>
      )}
      {data.map((d, i) => (
        <div key={d.state}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium">{d.state}</span>
            <span className="text-muted-foreground tabular-nums">{d.count}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(d.count / max) * 100}%` }}
              transition={{ delay: 0.15 + i * 0.06, duration: 0.5, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, var(--chart-${(i % 5) + 1}), color-mix(in oklch, var(--chart-${(i % 5) + 1}) 70%, white))`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
