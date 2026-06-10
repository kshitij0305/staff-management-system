"use client";

import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  UserPlus,
  UserPen,
  UserX,
  UserCheck,
  ArrowLeftRight,
  ContactRound,
  LogIn,
  CircleDot,
  type LucideIcon,
} from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import type { ActivityRow } from "../data";

const ACTION_ICONS: Record<string, { icon: LucideIcon; className: string }> = {
  EMPLOYEE_CREATED: { icon: UserPlus, className: "text-emerald-500" },
  EMPLOYEE_UPDATED: { icon: UserPen, className: "text-blue-500" },
  EMPLOYEE_DEACTIVATED: { icon: UserX, className: "text-rose-500" },
  EMPLOYEE_REACTIVATED: { icon: UserCheck, className: "text-emerald-500" },
  EMPLOYEE_TRANSFERRED: { icon: ArrowLeftRight, className: "text-amber-500" },
  PROSPECT_ADDED: { icon: ContactRound, className: "text-primary" },
  PROSPECT_UPDATED: { icon: ContactRound, className: "text-blue-500" },
  USER_LOGIN: { icon: LogIn, className: "text-muted-foreground" },
};

export function ActivityFeed({ rows }: { rows: ActivityRow[] }) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No activity yet.</p>;
  }
  return (
    <ul className="space-y-1">
      {rows.map((row, i) => {
        const meta = ACTION_ICONS[row.action] ?? { icon: CircleDot, className: "text-muted-foreground" };
        return (
          <motion.li
            key={row.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(i * 0.04, 0.4), duration: 0.25 }}
            className="flex items-center gap-2.5 rounded-lg p-2"
          >
            <div className="relative">
              <UserAvatar name={row.actorName} className="size-7" textClassName="text-[10px]" />
              <span className="absolute -right-1 -bottom-1 flex size-3.5 items-center justify-center rounded-full border bg-background">
                <meta.icon className={`size-2 ${meta.className}`} />
              </span>
            </div>
            <p className="min-w-0 flex-1 truncate text-sm">
              <span className="font-medium">{row.actorName}</span>{" "}
              <span className="text-muted-foreground">{row.summary}</span>
            </p>
            <span className="shrink-0 text-[11px] text-muted-foreground" suppressHydrationWarning>
              {formatDistanceToNow(
                new Date(Math.min(new Date(row.createdAt).getTime(), Date.now())),
                { addSuffix: true }
              )}
            </span>
          </motion.li>
        );
      })}
    </ul>
  );
}
