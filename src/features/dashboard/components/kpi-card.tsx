"use client";

import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import { AnimatedCounter } from "@/components/animated-counter";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  suffix = "",
  delta,
  deltaLabel,
  icon: Icon,
  index = 0,
}: {
  label: string;
  value: number;
  suffix?: string;
  /** Percent change vs the previous period; omit to hide. */
  delta?: number;
  deltaLabel?: string;
  icon: LucideIcon;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.35, ease: "easeOut" }}
      className="group relative overflow-hidden rounded-xl border bg-card p-5 transition-shadow hover:shadow-md"
    >
      <div className="pointer-events-none absolute -top-8 -right-8 size-24 rounded-full bg-primary/5 transition-transform group-hover:scale-150" />
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-3.5" />
        </span>
      </div>
      <div className="mt-2.5 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
        <AnimatedCounter value={value} suffix={suffix} />
      </div>
      {delta !== undefined && (
        <div className="mt-1.5 flex items-center gap-1 text-xs">
          <span
            className={cn(
              "flex items-center gap-0.5 font-medium",
              delta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            )}
          >
            {delta >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {Math.abs(delta)}%
          </span>
          {deltaLabel && <span className="text-muted-foreground">{deltaLabel}</span>}
        </div>
      )}
    </motion.div>
  );
}
