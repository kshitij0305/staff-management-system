"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Logo, LogoMark } from "@/components/logo";
import { UserAvatar } from "@/components/user-avatar";
import { ROLE_LABELS } from "@/lib/constants";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSession } from "./session-provider";
import { navItemsFor } from "./nav";

export function NavList({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const session = useSession();
  const pathname = usePathname();
  const items = navItemsFor(session.role);

  return (
    <nav className="flex flex-col gap-1 px-2">
      {items.map((item) => {
        const active =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
        const link = (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "relative flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
              active && "text-foreground",
              collapsed && "justify-center px-0"
            )}
          >
            {active && (
              <motion.span
                layoutId="sidebar-active"
                className="absolute inset-0 rounded-lg bg-muted"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
            <item.icon className={cn("relative z-10 size-4 shrink-0", active && "text-primary")} />
            {!collapsed && <span className="relative z-10">{item.title}</span>}
          </Link>
        );
        if (!collapsed) return link;
        return (
          <Tooltip key={item.href} delayDuration={0}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right">{item.title}</TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const session = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCollapsed(localStorage.getItem("vk-sidebar-collapsed") === "1");
  }, []);

  function toggle() {
    setCollapsed((c) => {
      localStorage.setItem("vk-sidebar-collapsed", c ? "0" : "1");
      return !c;
    });
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 240 }}
      transition={mounted ? { type: "spring", stiffness: 320, damping: 34 } : { duration: 0 }}
      className="sticky top-0 z-30 hidden h-dvh shrink-0 flex-col border-r bg-sidebar md:flex"
    >
      <div className={cn("flex h-14 items-center border-b px-4", collapsed && "justify-center px-0")}>
        {collapsed ? <LogoMark className="size-7" /> : <Logo />}
      </div>

      <div className="flex-1 overflow-y-auto py-3">
        <NavList collapsed={collapsed} />
      </div>

      <div className="border-t p-2">
        <div className={cn("flex items-center gap-2.5 rounded-lg p-2", collapsed && "justify-center p-1")}>
          <UserAvatar name={session.name} />
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-medium">{session.name}</div>
              <div className="truncate text-xs text-muted-foreground">
                {ROLE_LABELS[session.role]}
              </div>
            </div>
          )}
        </div>
        <button
          onClick={toggle}
          className={cn(
            "mt-1 flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            collapsed && "justify-center px-0"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          {!collapsed && "Collapse"}
        </button>
      </div>
    </motion.aside>
  );
}
