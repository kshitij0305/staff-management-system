"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { FieldType } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FIELD_TYPE_LABELS } from "@/lib/constants";
import type { FieldDef } from "../schemas";

const TYPE_ORDER: FieldType[] = ["TEXT", "NUMBER", "SELECT", "DATE", "BOOLEAN", "GEO", "IMAGE"];

export function FieldManager() {
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [loading, setLoading] = useState(true);

  const [label, setLabel] = useState("");
  const [type, setType] = useState<FieldType>("TEXT");
  const [optionsText, setOptionsText] = useState("");
  const [required, setRequired] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/fields");
    const data = await res.json().catch(() => ({ fields: [] }));
    setFields(data.fields ?? []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function add() {
    if (saving) return;
    const options =
      type === "SELECT"
        ? optionsText.split(",").map((o) => o.trim()).filter(Boolean)
        : [];
    setSaving(true);
    try {
      const res = await fetch("/api/fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, type, options, required }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't add field");
        return;
      }
      toast.success(`Added "${label}"`);
      setLabel("");
      setOptionsText("");
      setRequired(false);
      setType("TEXT");
      load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(field: FieldDef) {
    const res = await fetch(`/api/fields/${field.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Couldn't delete field");
      return;
    }
    toast.success(`Removed "${field.label}"`);
    setFields((f) => f.filter((x) => x.id !== field.id));
  }

  const canAdd =
    label.trim().length >= 2 &&
    (type !== "SELECT" ||
      optionsText.split(",").map((o) => o.trim()).filter(Boolean).length >= 2);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom prospect fields</CardTitle>
        <CardDescription>
          Add fields your team captures on every prospect — text, dropdowns, dates, GPS location, or photos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : fields.length === 0 ? (
          <p className="rounded-md border border-dashed py-6 text-center text-sm text-muted-foreground">
            No custom fields yet. Add your first below.
          </p>
        ) : (
          <ul className="divide-y rounded-md border">
            {fields.map((f) => (
              <li key={f.id} className="flex items-center gap-3 px-3 py-2.5">
                <GripVertical className="size-4 shrink-0 text-muted-foreground/50" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{f.label}</span>
                    {f.required && <span className="text-xs text-rose-500">required</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {FIELD_TYPE_LABELS[f.type]}
                    {f.type === "SELECT" && f.options.length > 0 && ` · ${f.options.join(", ")}`}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-rose-600"
                  onClick={() => remove(f)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-3 rounded-md border bg-muted/30 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fm-label">Field name</Label>
              <Input
                id="fm-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Next follow-up"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as FieldType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_ORDER.map((t) => (
                    <SelectItem key={t} value={t}>
                      {FIELD_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {type === "SELECT" && (
            <div className="space-y-1.5">
              <Label htmlFor="fm-options">Options (comma-separated)</Label>
              <Input
                id="fm-options"
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
                placeholder="Walk-in, Referral, Online"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-emerald-600"
                checked={required}
                onChange={(e) => setRequired(e.target.checked)}
              />
              <span className="text-muted-foreground">Required</span>
            </label>
            <Button size="sm" onClick={add} disabled={!canAdd || saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Add field
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
