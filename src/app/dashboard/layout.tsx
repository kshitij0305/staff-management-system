import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionProvider } from "@/components/shell/session-provider";
import { CommandPaletteProvider } from "@/components/shell/command-palette";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { TooltipProvider } from "@/components/ui/tooltip";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  // Re-check against the DB so deactivated users are kicked out even with a valid token.
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, name: true, email: true, role: true, employeeId: true, status: true },
  });
  if (!user || user.status === "INACTIVE") redirect("/login");

  return (
    <SessionProvider
      session={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
      }}
    >
      <CommandPaletteProvider>
        <TooltipProvider delayDuration={300}>
          <div className="flex min-h-dvh">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <Topbar />
              <main className="flex-1 p-4 sm:p-6">{children}</main>
            </div>
          </div>
        </TooltipProvider>
      </CommandPaletteProvider>
    </SessionProvider>
  );
}
