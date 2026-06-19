"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, createContext, useContext, useCallback } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor, LogOut, Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { UserAvatar } from "@/components/user-avatar";
import { useSession } from "./session-provider";
import { navItemsFor, isManager } from "./nav";

interface PaletteEmployee {
  id: string;
  name: string;
  level: { name: string };
  employeeId: string;
}

const PaletteContext = createContext<{ open: () => void }>({ open: () => {} });
export const usePalette = () => useContext(PaletteContext);

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const session = useSession();
  const { setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [employees, setEmployees] = useState<PaletteEmployee[] | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Lazy-load the (scoped) employee list the first time the palette opens
  useEffect(() => {
    if (!open || employees !== null || !isManager(session)) return;
    fetch("/api/employees?pageSize=200")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setEmployees(data?.employees ?? []))
      .catch(() => setEmployees([]));
  }, [open, employees, session]);

  const run = useCallback((fn: () => void) => {
    setOpen(false);
    fn();
  }, []);

  return (
    <PaletteContext.Provider value={{ open: () => setOpen(true) }}>
      {children}
      <CommandDialog open={open} onOpenChange={setOpen} title="Command palette" description="Search and navigate">
        <CommandInput placeholder="Search pages, people, actions…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigate">
            {navItemsFor(session).map((item) => (
              <CommandItem key={item.href} onSelect={() => run(() => router.push(item.href))}>
                <item.icon className="size-4" />
                {item.title}
              </CommandItem>
            ))}
          </CommandGroup>
          {employees && employees.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="People">
                {employees.map((e) => (
                  <CommandItem
                    key={e.id}
                    value={`${e.name} ${e.employeeId} ${e.level.name}`}
                    onSelect={() => run(() => router.push(`/dashboard/employees/${e.id}`))}
                  >
                    <UserAvatar name={e.name} className="size-5" textClassName="text-[8px]" />
                    <span>{e.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {e.level.name}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
          <CommandSeparator />
          <CommandGroup heading="Theme">
            <CommandItem onSelect={() => run(() => setTheme("light"))}>
              <Sun className="size-4" /> Light
            </CommandItem>
            <CommandItem onSelect={() => run(() => setTheme("dark"))}>
              <Moon className="size-4" /> Dark
            </CommandItem>
            <CommandItem onSelect={() => run(() => setTheme("system"))}>
              <Monitor className="size-4" /> System
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Account">
            <CommandItem
              onSelect={() =>
                run(async () => {
                  await fetch("/api/auth/logout", { method: "POST" });
                  router.push("/login");
                  router.refresh();
                })
              }
            >
              <LogOut className="size-4" /> Sign out
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </PaletteContext.Provider>
  );
}

/** Topbar trigger button showing the ⌘K hint. */
export function PaletteButton() {
  const { open } = usePalette();
  return (
    <button
      onClick={open}
      className="flex h-8 w-full max-w-60 items-center gap-2 rounded-lg border bg-muted/40 px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted sm:w-60"
    >
      <Search className="size-3.5" />
      <span className="flex-1 text-left text-xs">Search…</span>
      <kbd className="pointer-events-none rounded border bg-background px-1.5 font-mono text-[10px]">
        Ctrl K
      </kbd>
    </button>
  );
}
