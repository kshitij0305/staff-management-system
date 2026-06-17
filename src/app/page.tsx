import Link from "next/link";
import { ArrowRight, BarChart3, Network, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

const FEATURES = [
  {
    icon: Network,
    title: "Hierarchy built in",
    body: "Owner to CPE — one org chart, clear reporting lines, instant transfers.",
  },
  {
    icon: BarChart3,
    title: "Live performance",
    body: "Prospect trends, leaderboards and interest rates, scoped to what you manage.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based access",
    body: "Everyone sees exactly their team and nothing more, enforced on every request.",
  },
];

export default function LandingPage() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      {/* backdrop */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(55% 45% at 50% 0%, color-mix(in oklch, var(--primary) 13%, transparent) 0%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.5] dark:opacity-[0.25]"
        style={{
          backgroundImage:
            "linear-gradient(color-mix(in oklch, var(--foreground) 6%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklch, var(--foreground) 6%, transparent) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(70% 60% at 50% 30%, black 0%, transparent 100%)",
        }}
      />

      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Logo />
        <Button variant="outline" asChild>
          <Link href="/login">Sign in</Link>
        </Button>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-20 text-center">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            VK Group · APN Solar Energy Pvt. Ltd.
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            Your whole sales force,{" "}
            <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
              one portal
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            Manage employees, track every field visit and watch performance roll up the hierarchy —
            from CPE to Owner, in real time.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/login">
                Open dashboard <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-20 grid w-full max-w-4xl gap-4 sm:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="animate-in fade-in slide-in-from-bottom-6 rounded-xl border bg-card/70 p-5 text-left backdrop-blur duration-700"
              style={{ animationDelay: `${150 + i * 120}ms`, animationFillMode: "backwards" }}
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="size-4.5" />
              </div>
              <h3 className="mt-3 text-sm font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="px-6 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} VK Group — Staff Management System
      </footer>
    </div>
  );
}
