/** Abstract "team + solar" illustration for the login page right panel. */
export function LoginArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 480 360" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      {/* sun + glow */}
      <circle cx="240" cy="98" r="64" fill="url(#la-sun)" opacity="0.25" />
      <circle cx="240" cy="98" r="34" fill="url(#la-sun)" />
      <g stroke="#34d399" strokeWidth="3" strokeLinecap="round" opacity="0.7">
        <path d="M240 38v-14" />
        <path d="M296 56l10-10" />
        <path d="M184 56l-10-10" />
        <path d="M306 98h14" />
        <path d="M174 98h-14" />
      </g>

      {/* connector lines */}
      <g stroke="#10b981" strokeWidth="2" opacity="0.5">
        <path d="M240 140v36" />
        <path d="M240 176c-70 0-120 18-120 52" />
        <path d="M240 176c70 0 120 18 120 52" />
        <path d="M240 176v52" />
      </g>

      {/* root card */}
      <g>
        <rect x="196" y="140" width="88" height="36" rx="10" fill="#1c1917" stroke="#10b981" strokeOpacity="0.6" />
        <circle cx="216" cy="158" r="9" fill="#10b981" />
        <rect x="232" y="150" width="40" height="5" rx="2.5" fill="#e7e5e4" opacity="0.9" />
        <rect x="232" y="161" width="28" height="5" rx="2.5" fill="#a8a29e" opacity="0.7" />
      </g>

      {/* three child cards */}
      {[
        { x: 76, accent: "#38bdf8" },
        { x: 196, accent: "#34d399" },
        { x: 316, accent: "#f472b6" },
      ].map((c, i) => (
        <g key={i}>
          <rect x={c.x} y="228" width="88" height="36" rx="10" fill="#1c1917" stroke="#44403c" />
          <circle cx={c.x + 20} cy="246" r="9" fill={c.accent} />
          <rect x={c.x + 36} y="238" width="40" height="5" rx="2.5" fill="#e7e5e4" opacity="0.9" />
          <rect x={c.x + 36} y="249" width="26" height="5" rx="2.5" fill="#a8a29e" opacity="0.7" />
        </g>
      ))}

      {/* grandchildren dots */}
      <g fill="#78716c">
        {[96, 120, 144, 216, 240, 264, 336, 360, 384].map((x, i) => (
          <circle key={i} cx={x} cy="300" r="5" opacity="0.8" />
        ))}
      </g>
      <g stroke="#57534e" strokeWidth="1.5" opacity="0.6">
        <path d="M120 264v22M120 286h-24M120 286h24" />
        <path d="M240 264v22M240 286h-24M240 286h24" />
        <path d="M360 264v22M360 286h-24M360 286h24" />
      </g>

      {/* sparkline */}
      <path
        d="M60 330 L110 318 L160 324 L210 306 L260 312 L310 294 L360 300 L420 282"
        stroke="url(#la-spark)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="420" cy="282" r="5" fill="#10b981" />

      <defs>
        <linearGradient id="la-sun" x1="206" y1="64" x2="274" y2="132" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34d399" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="la-spark" x1="60" y1="330" x2="420" y2="282" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10b981" stopOpacity="0.2" />
          <stop offset="1" stopColor="#10b981" />
        </linearGradient>
      </defs>
    </svg>
  );
}
