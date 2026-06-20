import { Check } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

const POINTS = [
  "Name your own hierarchy levels",
  "Track prospects across the whole team",
  "Live leaderboards & performance",
];

/** Premium right-hand panel for the auth pages. */
export function AuthAside({
  headline,
  sub,
}: {
  headline: React.ReactNode;
  sub: string;
}) {
  return (
    <div className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12 lg:text-white">
      {/* layered green backdrop */}
      <div className="absolute inset-0 -z-20 bg-[#03100b]" />
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(70% 55% at 25% 15%, rgba(16,185,129,0.30) 0%, transparent 60%), radial-gradient(60% 50% at 90% 90%, rgba(5,150,105,0.22) 0%, transparent 65%)",
        }}
      />
      <div
        className="absolute inset-0 -z-10 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(75% 75% at 30% 25%, black 0%, transparent 100%)",
        }}
      />
      {/* glow orb */}
      <div className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-emerald-400/20 blur-3xl" />

      {/* brand */}
      <div className="relative flex items-center gap-2 text-sm font-semibold tracking-tight text-white/90">
        <span className="flex size-6 items-center justify-center rounded-md bg-white/10 ring-1 ring-white/15">
          <span className="size-2 rounded-full bg-emerald-400" />
        </span>
        {APP_NAME}
      </div>

      {/* center: headline + glass org preview */}
      <div className="relative max-w-md">
        <h2 className="text-3xl font-semibold leading-tight tracking-tight text-balance">
          {headline}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-white/60">{sub}</p>

        {/* frosted "org" preview card */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/40 backdrop-blur-md">
          <OrgPreview />
        </div>

        <ul className="mt-7 space-y-2.5">
          {POINTS.map((p) => (
            <li key={p} className="flex items-center gap-2.5 text-sm text-white/80">
              <span className="flex size-5 items-center justify-center rounded-full bg-emerald-400/15 ring-1 ring-emerald-400/30">
                <Check className="size-3 text-emerald-300" />
              </span>
              {p}
            </li>
          ))}
        </ul>
      </div>

      {/* footer testimonial */}
      <figure className="relative max-w-md">
        <blockquote className="text-sm leading-relaxed text-white/70">
          “We modelled our exact org in minutes — no rigid roles, just our structure.”
        </blockquote>
        <figcaption className="mt-2 text-xs text-white/40">A team using {APP_NAME}</figcaption>
      </figure>
    </div>
  );
}

/** Tiny glassy org chart: one owner → two reports. */
function OrgPreview() {
  return (
    <div className="flex flex-col items-center gap-3">
      <PreviewNode name="Priya" role="Owner" dot="bg-violet-400" />
      <div className="h-4 w-px bg-white/15" />
      <div className="flex items-start gap-6">
        <div className="flex flex-col items-center">
          <PreviewNode name="Arjun" role="Manager" dot="bg-sky-400" />
        </div>
        <div className="flex flex-col items-center">
          <PreviewNode name="Neha" role="Agent" dot="bg-emerald-400" />
        </div>
      </div>
    </div>
  );
}

function PreviewNode({ name, role, dot }: { name: string; role: string; dot: string }) {
  return (
    <div className="flex w-36 items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2">
      <span className={`flex size-7 items-center justify-center rounded-full text-[10px] font-semibold text-white ${dot}`}>
        {name[0]}
      </span>
      <div className="leading-tight">
        <div className="text-xs font-medium text-white">{name}</div>
        <div className="text-[10px] text-white/50">{role}</div>
      </div>
    </div>
  );
}
