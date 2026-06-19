import { ProspectStatus, EmployeeStatus } from "@prisma/client";

export const APP_NAME = "Hierly";

/**
 * Hierarchy levels are customer-defined per org, so their colours are derived
 * from `rank` (1 = leaf … N = top) instead of a fixed enum. Palette is ordered
 * leaf → top, cycling for deep hierarchies.
 */
const LEVEL_BADGE_PALETTE = [
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20",
  "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border-amber-200 dark:border-amber-500/20",
  "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/20",
  "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 border-blue-200 dark:border-blue-500/20",
  "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300 border-violet-200 dark:border-violet-500/20",
  "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 border-rose-200 dark:border-rose-500/20",
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/20",
  "bg-lime-100 text-lime-700 dark:bg-lime-500/15 dark:text-lime-300 border-lime-200 dark:border-lime-500/20",
];

const LEVEL_HEX_PALETTE = [
  "#10b981", "#f59e0b", "#06b6d4", "#3b82f6", "#8b5cf6", "#f43f5e", "#6366f1", "#84cc16",
];

export function levelBadgeClasses(rank: number): string {
  return LEVEL_BADGE_PALETTE[(Math.max(1, rank) - 1) % LEVEL_BADGE_PALETTE.length];
}

export function levelHex(rank: number): string {
  return LEVEL_HEX_PALETTE[(Math.max(1, rank) - 1) % LEVEL_HEX_PALETTE.length];
}

export const PROSPECT_STATUS_LABELS: Record<ProspectStatus, string> = {
  INTERESTED: "Interested",
  NOT_INTERESTED: "Not interested",
  FOLLOW_UP: "Follow up",
};

export const PROSPECT_STATUS_CLASSES: Record<ProspectStatus, string> = {
  INTERESTED:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20",
  NOT_INTERESTED:
    "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 border-rose-200 dark:border-rose-500/20",
  FOLLOW_UP:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border-amber-200 dark:border-amber-500/20",
};

export const PROSPECT_STATUS_HEX: Record<ProspectStatus, string> = {
  INTERESTED: "#10b981",
  NOT_INTERESTED: "#f43f5e",
  FOLLOW_UP: "#f59e0b",
};

export const EMPLOYEE_STATUS_LABELS: Record<EmployeeStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
};

/** Deterministic avatar gradient from a seed string. */
const AVATAR_GRADIENTS = [
  "from-violet-500 to-fuchsia-500",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-indigo-500 to-blue-500",
  "from-cyan-500 to-sky-500",
  "from-lime-500 to-emerald-500",
];

export function avatarGradient(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}
