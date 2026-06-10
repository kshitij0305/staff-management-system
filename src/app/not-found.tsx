import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="px-6 py-5">
        <Logo />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-24 text-center">
        <div className="relative">
          <div className="absolute inset-0 -m-6 rounded-full bg-primary/10 blur-2xl" />
          <div className="relative flex size-16 items-center justify-center rounded-2xl border bg-card shadow-sm">
            <Compass className="size-7 text-primary" />
          </div>
        </div>
        <h1 className="mt-6 text-5xl font-semibold tracking-tight">404</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          This page wandered off the route map. Let&apos;s get you back to familiar territory.
        </p>
        <Button className="mt-6" asChild>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </main>
    </div>
  );
}
