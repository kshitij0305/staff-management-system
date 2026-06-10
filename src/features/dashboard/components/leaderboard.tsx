"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { ROLE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { LeaderRow } from "../data";

const RANK_STYLES = [
  "bg-amber-400/90 text-amber-950", // gold
  "bg-stone-300 text-stone-700", // silver
  "bg-orange-300/80 text-orange-900", // bronze
];

export function Leaderboard({ rows, linkable = true }: { rows: LeaderRow[]; linkable?: boolean }) {
  const max = Math.max(1, ...rows.map((r) => r.count));

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <Trophy className="size-5 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">No prospects in the last 30 days.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {rows.map((row, i) => {
        const inner = (
          <>
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                RANK_STYLES[i] ?? "bg-muted text-muted-foreground"
              )}
            >
              {i + 1}
            </span>
            <UserAvatar name={row.name} className="size-7" textClassName="text-[10px]" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-medium">{row.name}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  <span className="font-semibold text-foreground">{row.count}</span> ·{" "}
                  {row.interested} interested
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(row.count / max) * 100}%` }}
                  transition={{ delay: 0.2 + i * 0.07, duration: 0.5, ease: "easeOut" }}
                  className="h-full rounded-full bg-primary"
                />
              </div>
            </div>
          </>
        );
        const className = "flex items-center gap-2.5 rounded-lg p-2 transition-colors";
        return linkable ? (
          <Link
            key={row.id}
            href={`/dashboard/employees/${row.id}`}
            className={cn(className, "hover:bg-muted")}
            title={ROLE_LABELS[row.role]}
          >
            {inner}
          </Link>
        ) : (
          <div key={row.id} className={className}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
