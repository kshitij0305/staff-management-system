"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/logo";
import { UserAvatar } from "@/components/user-avatar";
import { ROLE_LABELS } from "@/lib/constants";
import { useSession } from "./session-provider";
import { ThemeToggle } from "./theme-toggle";
import { PaletteButton } from "./command-palette";
import { NavList } from "./sidebar";

const TITLES: [string, string][] = [
  ["/dashboard/employees", "Employees"],
  ["/dashboard/prospects", "Prospects"],
  ["/dashboard/hierarchy", "Hierarchy"],
  ["/dashboard/activity", "Activity"],
  ["/dashboard", "Dashboard"],
];

export function Topbar() {
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const title = TITLES.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? "Dashboard";

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
      {/* Mobile nav */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
            <Menu className="size-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="border-b px-4 py-3">
            <SheetTitle>
              <Logo />
            </SheetTitle>
          </SheetHeader>
          <div className="py-3">
            <NavList onNavigate={() => setMobileOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <h1 className="hidden text-sm font-semibold tracking-tight sm:block">{title}</h1>

      <div className="flex flex-1 justify-center px-2">
        <PaletteButton />
      </div>

      <ThemeToggle />

      <DropdownMenu>
        <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <UserAvatar name={session.name} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="text-sm font-medium">{session.name}</div>
            <div className="text-xs font-normal text-muted-foreground">
              {ROLE_LABELS[session.role]} · {session.employeeId}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/employees/${session.id}`}>
              <User className="size-4" /> My profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} variant="destructive">
            <LogOut className="size-4" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
