import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/constants";
import { getCpeData, getOverviewData } from "@/features/dashboard/data";
import { OverviewDashboard } from "@/features/dashboard/components/overview-dashboard";
import { CpeDashboard } from "@/features/dashboard/components/cpe-dashboard";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/** ONE dashboard route — widgets are composed per role. */
export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const firstName = session.name.split(" ")[0];

  if (session.role === "CPE") {
    const data = await getCpeData(session);
    return (
      <div className="mx-auto max-w-6xl">
        <CpeDashboard data={data} firstName={firstName} />
      </div>
    );
  }

  const data = await getOverviewData(session);
  const variant = session.role === "CHAIRMAN" || session.role === "NATIONAL_HEAD" ? "executive" : "manager";

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          {greeting()}, {firstName}
        </h2>
        <p className="text-sm text-muted-foreground">
          {variant === "executive"
            ? "Here's how the company is performing."
            : `Here's how your team is performing, ${ROLE_LABELS[session.role]}.`}
        </p>
      </div>
      <OverviewDashboard data={data} variant={variant} />
    </div>
  );
}
