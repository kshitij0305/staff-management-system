"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { format, formatDistanceToNow, isToday, isYesterday, startOfDay } from "date-fns";
import { toast } from "sonner";
import { Activity as ActivityIcon, Loader2 } from "lucide-react";
import type { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/user-avatar";
import { RoleBadge } from "@/components/badges";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

interface LogRow {
  id: string;
  action: string;
  summary: string;
  createdAt: string;
  actor: { id: string; name: string; role: Role };
}

const PAGE_SIZE = 25;

const ACTION_DOT: Record<string, string> = {
  EMPLOYEE_CREATED: "bg-emerald-500",
  EMPLOYEE_UPDATED: "bg-blue-500",
  EMPLOYEE_DEACTIVATED: "bg-rose-500",
  EMPLOYEE_REACTIVATED: "bg-emerald-500",
  EMPLOYEE_TRANSFERRED: "bg-amber-500",
  PROSPECT_ADDED: "bg-primary",
  PROSPECT_UPDATED: "bg-blue-500",
  USER_LOGIN: "bg-stone-400",
};

function dayLabel(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, d MMMM");
}

export function ActivityList() {
  const [type, setType] = useState("ALL");
  const [logs, setLogs] = useState<LogRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLogs(null);
    setPage(1);
    const params = new URLSearchParams({ page: "1", pageSize: String(PAGE_SIZE) });
    if (type !== "ALL") params.set("type", type);
    fetch(`/api/activity?${params}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (cancelled) return;
        setLogs(data.logs);
        setTotal(data.total);
      })
      .catch(() => !cancelled && toast.error("Could not load activity"));
    return () => {
      cancelled = true;
    };
  }, [type]);

  async function loadMore() {
    if (loadingMore || logs === null) return;
    setLoadingMore(true);
    try {
      const next = page + 1;
      const params = new URLSearchParams({ page: String(next), pageSize: String(PAGE_SIZE) });
      if (type !== "ALL") params.set("type", type);
      const res = await fetch(`/api/activity?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLogs((prev) => [...(prev ?? []), ...data.logs]);
      setTotal(data.total);
      setPage(next);
    } catch {
      toast.error("Could not load more");
    } finally {
      setLoadingMore(false);
    }
  }

  // Group rows by day for sticky headers
  const groups: { label: string; rows: LogRow[] }[] = [];
  for (const log of logs ?? []) {
    const label = dayLabel(startOfDay(new Date(log.createdAt)));
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.rows.push(log);
    else groups.push({ label, rows: [log] });
  }

  return (
    <div className="space-y-4">
      <Tabs value={type} onValueChange={setType}>
        <TabsList>
          <TabsTrigger value="ALL">All</TabsTrigger>
          <TabsTrigger value="PROSPECTS">Prospects</TabsTrigger>
          <TabsTrigger value="EMPLOYEES">Employees</TabsTrigger>
          <TabsTrigger value="LOGINS">Logins</TabsTrigger>
        </TabsList>
      </Tabs>

      {logs === null ? (
        <div className="space-y-3 rounded-xl border bg-card p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={<ActivityIcon />}
          title="No activity yet"
          description="Actions taken by you and your team will appear here."
        />
      ) : (
        <div className="rounded-xl border bg-card">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="sticky top-14 z-10 border-b bg-muted/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
                {group.label}
              </div>
              <ul className="divide-y">
                {group.rows.map((log, i) => (
                  <motion.li
                    key={log.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.2), duration: 0.2 }}
                    className="flex items-center gap-3 px-4 py-2.5"
                  >
                    <span
                      className={`size-2 shrink-0 rounded-full ${ACTION_DOT[log.action] ?? "bg-muted-foreground"}`}
                    />
                    <UserAvatar name={log.actor.name} className="size-7" textClassName="text-[10px]" />
                    <p className="min-w-0 flex-1 text-sm">
                      <Link
                        href={`/dashboard/employees/${log.actor.id}`}
                        className="font-medium hover:text-primary"
                      >
                        {log.actor.name}
                      </Link>{" "}
                      <span className="text-muted-foreground">{log.summary}</span>
                    </p>
                    <RoleBadge role={log.actor.role} className="hidden sm:inline-flex" />
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </div>
          ))}
          {logs.length < total && (
            <div className="border-t p-3 text-center">
              <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore}>
                {loadingMore && <Loader2 className="size-3.5 animate-spin" />}
                Load more ({total - logs.length} older)
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
