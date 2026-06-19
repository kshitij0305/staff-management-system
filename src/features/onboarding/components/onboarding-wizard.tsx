"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GripVertical, Loader2, Plus, Trash2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { levelHex } from "@/lib/constants";

const TEMPLATES: { label: string; levels: string[] }[] = [
  { label: "Sales org", levels: ["Owner", "Regional Head", "Manager", "Agent"] },
  { label: "Field team", levels: ["Owner", "National Head", "CSM", "ASM", "CPE"] },
  { label: "Simple", levels: ["Owner", "Manager", "Member"] },
];

export function OnboardingWizard({ orgName }: { orgName: string }) {
  const router = useRouter();
  // index 0 = top (the Owner — fixed); rest are editable.
  const [levels, setLevels] = useState<string[]>(["Owner", "Manager", "Member"]);
  const [saving, setSaving] = useState(false);

  function setName(i: number, v: string) {
    setLevels((ls) => ls.map((l, idx) => (idx === i ? v : l)));
  }
  function addLevel() {
    if (levels.length >= 8) return;
    setLevels((ls) => [...ls, ""]);
  }
  function removeLevel(i: number) {
    if (i === 0 || levels.length <= 1) return;
    setLevels((ls) => ls.filter((_, idx) => idx !== i));
  }

  const n = levels.length;
  const clean = levels.map((l) => l.trim());
  const valid = clean.every((l) => l.length > 0) && new Set(clean.map((c) => c.toLowerCase())).size === n;

  async function save() {
    if (!valid || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/levels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ levels: clean }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not save your hierarchy");
        return;
      }
      toast.success("Hierarchy created 🎉");
      router.push("/dashboard");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-1 text-xs font-medium tracking-widest text-primary uppercase">
        Welcome to {orgName}
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Design your hierarchy</h1>
      <p className="mt-1.5 mb-6 text-sm text-muted-foreground">
        Name your levels from most senior (top) to most junior. You can change these later.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        <span className="text-xs text-muted-foreground">Start from a template:</span>
        {TEMPLATES.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={() => setLevels(t.levels)}
            className="rounded-md border bg-background px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-2">
          {levels.map((lvl, i) => {
            const rank = n - i; // top has highest rank
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2"
              >
                <GripVertical className="size-4 shrink-0 text-muted-foreground/50" />
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: levelHex(rank) }}
                />
                <Input
                  value={lvl}
                  onChange={(e) => setName(i, e.target.value)}
                  placeholder={i === 0 ? "Top level (e.g. Owner)" : "Level name"}
                  className="h-9"
                />
                <span className="w-20 shrink-0 text-right text-[11px] text-muted-foreground">
                  {i === 0 ? "sees all" : `level ${rank}`}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeLevel(i)}
                  disabled={i === 0 || levels.length <= 1}
                  aria-label="Remove level"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </motion.div>
            );
          })}

          <Button variant="outline" size="sm" className="mt-1 w-full" onClick={addLevel} disabled={levels.length >= 8}>
            <Plus className="size-4" /> Add a level below
          </Button>
        </CardContent>
      </Card>

      {!valid && (
        <p className="mt-2 text-xs text-destructive">Every level needs a unique, non-empty name.</p>
      )}

      <Button size="lg" className="mt-5 w-full" onClick={save} disabled={!valid || saving}>
        {saving ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
        Finish setup
      </Button>
    </div>
  );
}
