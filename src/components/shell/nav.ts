import {
  LayoutDashboard,
  Users,
  ContactRound,
  Network,
  Activity,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { ClientSession } from "./session-provider";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Manager-only items are hidden from leaf-level users (those who manage nobody). */
  managerOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Prospects", href: "/dashboard/prospects", icon: ContactRound },
  { title: "Employees", href: "/dashboard/employees", icon: Users, managerOnly: true },
  { title: "Hierarchy", href: "/dashboard/hierarchy", icon: Network, managerOnly: true },
  { title: "Activity", href: "/dashboard/activity", icon: Activity },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];

/** A user "manages" if they see everything or sit above the leaf level. */
export function isManager(session: Pick<ClientSession, "seesAll" | "levelRank">): boolean {
  return session.seesAll || session.levelRank > 1;
}

export function navItemsFor(session: Pick<ClientSession, "seesAll" | "levelRank">): NavItem[] {
  const manager = isManager(session);
  return NAV_ITEMS.filter((item) => !item.managerOnly || manager);
}
