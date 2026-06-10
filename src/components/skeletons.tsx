import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2.5 p-4">
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 py-1.5">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-5 flex-1" style={{ opacity: 1 - r * 0.08 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-5">
      <Skeleton className="h-3.5 w-24" />
      <Skeleton className="mt-3 h-8 w-20" />
      <Skeleton className="mt-2 h-3 w-32" />
    </div>
  );
}

export function ChartSkeleton({ className = "h-72" }: { className?: string }) {
  return (
    <div className={`flex items-end gap-2 rounded-xl border bg-card p-6 ${className}`}>
      {[40, 65, 50, 80, 60, 90, 70, 55, 75, 85, 45, 95].map((h, i) => (
        <Skeleton key={i} className="flex-1" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}
