import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-8", className)}
      aria-hidden
    >
      <rect width="40" height="40" rx="10" fill="url(#hierly-logo-bg)" />
      {/* a small hierarchy: one node on top, two below */}
      <g stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.9">
        <path d="M20 14v5" />
        <path d="M20 19c0 0 -8 0 -8 6" />
        <path d="M20 19c0 0 8 0 8 6" />
      </g>
      <g fill="white">
        <circle cx="20" cy="12" r="3.2" />
        <circle cx="12" cy="27" r="3.2" />
        <circle cx="28" cy="27" r="3.2" />
      </g>
      <defs>
        <linearGradient id="hierly-logo-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10b981" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Logo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className={markClassName} />
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-tight">{APP_NAME}</div>
        <div className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
          CRM
        </div>
      </div>
    </div>
  );
}
