import Link from "next/link";
import { ArrowRight, BarChart3, Network, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { APP_NAME } from "@/lib/constants";

const FEATURES = [
  {
    icon: Network,
    title: "Your own hierarchy",
    body: "Name your levels — Owner, Manager, Agent, whatever fits — and Hierly builds the org chart and reporting lines.",
  },
  {
    icon: BarChart3,
    title: "Prospects & performance",
    body: "Every team member logs prospects; trends, leaderboards and interest rates roll up the tree in real time.",
  },
  {
    icon: ShieldCheck,
    title: "Isolated & secure",
    body: "Each company's data is fully isolated, and everyone sees exactly their slice — enforced on every request.",
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
            Multi-tenant team CRM
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            Build your team&apos;s CRM,{" "}
            <span className="bg-gradient-to-r from-emerald-500 to-green-600 bg-clip-text text-transparent">
              your hierarchy
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            Define your own levels, build your org tree, and track prospects across the whole team —
            a CRM shaped exactly like your company, ready in minutes.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/signup">
                Start free <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign in</Link>
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
        © {new Date().getFullYear()} {APP_NAME}
      </footer>
    </div>
  );
}
