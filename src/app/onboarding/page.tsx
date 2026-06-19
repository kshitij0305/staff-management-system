import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/logo";
import { OnboardingWizard } from "@/features/onboarding/components/onboarding-wizard";

export const metadata: Metadata = { title: "Set up your workspace" };

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const org = await prisma.organization.findUnique({
    where: { id: session.orgId },
    select: { name: true, onboarded: true },
  });
  if (!org) redirect("/login");
  // Already set up → straight to the app.
  if (org.onboarded) redirect("/dashboard");

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="px-6 py-5 sm:px-10">
        <Logo />
      </header>
      <main className="flex flex-1 items-center justify-center px-6 pb-16">
        <OnboardingWizard orgName={org.name} />
      </main>
    </div>
  );
}
