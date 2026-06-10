import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { EmployeesTable } from "@/features/employees/components/employees-table";

export const metadata: Metadata = { title: "Employees" };

export default async function EmployeesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  // CPEs have no team to manage
  if (session.role === "CPE") redirect("/dashboard");

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Employees</h2>
        <p className="text-sm text-muted-foreground">
          Manage your team — create, edit, transfer and deactivate members.
        </p>
      </div>
      <EmployeesTable />
    </div>
  );
}
