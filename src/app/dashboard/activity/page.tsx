import type { Metadata } from "next";
import { ActivityList } from "@/features/activity/components/activity-list";

export const metadata: Metadata = { title: "Activity" };

export default function ActivityPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Activity</h2>
        <p className="text-sm text-muted-foreground">
          Everything that happens across your team, newest first.
        </p>
      </div>
      <ActivityList />
    </div>
  );
}
