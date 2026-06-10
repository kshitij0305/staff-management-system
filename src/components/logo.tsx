import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-8", className)}
      aria-hidden
    >
      <rect width="40" height="40" rx="10" fill="url(#vk-logo-bg)" />
      <g stroke="white" strokeWidth="2.4" strokeLinecap="round">
        <circle cx="20" cy="21" r="6" fill="white" stroke="none" />
        <path d="M20 9.5v3" />
        <path d="M20 30.5v-3" opacity="0.55" />
        <path d="M31.5 21h-3" />
        <path d="M8.5 21h3" />
        <path d="M28.1 12.9l-2.1 2.1" />
        <path d="M11.9 12.9l2.1 2.1" />
        <path d="M28.1 29.1l-2.1-2.1" opacity="0.55" />
        <path d="M11.9 29.1l2.1-2.1" opacity="0.55" />
      </g>
      <defs>
        <linearGradient id="vk-logo-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f59e0b" />
          <stop offset="1" stopColor="#ea580c" />
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
        <div className="text-sm font-semibold tracking-tight">VK Group</div>
        <div className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
          Staff Portal
        </div>
      </div>
    </div>
  );
}
