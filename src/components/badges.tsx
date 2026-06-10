import type { Role, ProspectStatus, EmployeeStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import {
  ROLE_BADGE_CLASSES,
  ROLE_LABELS,
  PROSPECT_STATUS_CLASSES,
  PROSPECT_STATUS_LABELS,
} from "@/lib/constants";

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium",
        ROLE_BADGE_CLASSES[role],
        className
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}

export function ProspectStatusBadge({
  status,
  className,
}: {
  status: ProspectStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium",
        PROSPECT_STATUS_CLASSES[status],
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {PROSPECT_STATUS_LABELS[status]}
    </span>
  );
}

export function EmployeeStatusBadge({
  status,
  className,
}: {
  status: EmployeeStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-[11px] font-medium",
        status === "ACTIVE"
          ? "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300"
          : "border-stone-200 bg-stone-100 text-stone-500 dark:border-stone-500/20 dark:bg-stone-500/15 dark:text-stone-400",
        className
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "ACTIVE" ? "animate-pulse bg-emerald-500" : "bg-stone-400"
        )}
      />
      {status === "ACTIVE" ? "Active" : "Inactive"}
    </span>
  );
}
