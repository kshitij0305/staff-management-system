import type { Metadata } from "next";
import { ProspectsTable } from "@/features/prospects/components/prospects-table";

export const metadata: Metadata = { title: "Prospects" };

export default function ProspectsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Prospects</h2>
        <p className="text-sm text-muted-foreground">
          Customer visits collected in the field — defaults to the last 3 days.
        </p>
      </div>
      <ProspectsTable />
    </div>
  );
}
