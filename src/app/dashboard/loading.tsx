import { Skeleton } from "@/components/ui/skeleton";
import { StatCardSkeleton, ChartSkeleton } from "@/components/skeletons";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartSkeleton className="h-80 lg:col-span-2" />
        <ChartSkeleton className="h-80" />
      </div>
    </div>
  );
}
