import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLE_LABELS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { RoleBadge } from "@/components/badges";
import { UserAvatar } from "@/components/user-avatar";
import { AccountSettings } from "@/features/settings/components/account-settings";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      employeeId: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      city: true,
      state: true,
      joiningDate: true,
      manager: { select: { name: true } },
    },
  });
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your account and preferences.</p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-4">
          <UserAvatar name={user.name} className="size-14" textClassName="text-lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold">{user.name}</span>
              <RoleBadge role={user.role} />
            </div>
            <div className="mt-0.5 text-sm text-muted-foreground">
              {ROLE_LABELS[user.role]} · {user.employeeId}
              {user.manager && <> · reports to {user.manager.name}</>}
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            Joined {format(user.joiningDate, "d MMM yyyy")}
          </div>
        </CardContent>
      </Card>

      <AccountSettings
        account={{
          name: user.name,
          email: user.email,
          phone: user.phone,
          city: user.city,
          state: user.state,
        }}
      />
    </div>
  );
}
