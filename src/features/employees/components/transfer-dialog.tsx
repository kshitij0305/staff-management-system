"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/user-avatar";
import type { EmployeeRow, LevelLite } from "../types";

type TransferTarget = Pick<EmployeeRow, "id" | "name" | "level" | "manager">;

export function TransferDialog({
  open,
  onOpenChange,
  employee,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: TransferTarget | null;
  onSaved: () => void;
}) {
  const [managerLevel, setManagerLevel] = useState<LevelLite | null>(null);
  const [managers, setManagers] = useState<{ id: string; name: string; employeeId: string }[] | null>(null);
  const [managerId, setManagerId] = useState("");
  const [saving, setSaving] = useState(false);

  // A transferred employee reports one level up.
  const requiredRank = employee ? employee.level.rank + 1 : null;

  useEffect(() => {
    if (!open || !employee || requiredRank === null) return;
    setManagerId("");
    setManagers(null);
    setManagerLevel(null);
    (async () => {
      const levelsRes = await fetch("/api/levels").then((r) => (r.ok ? r.json() : null));
      const lvl: LevelLite | undefined = (levelsRes?.levels ?? []).find(
        (l: LevelLite) => l.rank === requiredRank
      );
      if (!lvl) {
        setManagers([]);
        return;
      }
      setManagerLevel(lvl);
      const empRes = await fetch(`/api/employees?levelId=${lvl.id}&status=ACTIVE&pageSize=200`).then(
        (r) => (r.ok ? r.json() : null)
      );
      setManagers(
        (empRes?.employees ?? []).filter(
          (m: { id: string }) => m.id !== employee.manager?.id && m.id !== employee.id
        )
      );
    })().catch(() => setManagers([]));
  }, [open, employee, requiredRank]);

  async function submit() {
    if (!employee || !managerId || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/employees/${employee.id}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managerId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Transfer failed");
        return;
      }
      toast.success(`${employee.name} transferred`);
      onOpenChange(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Transfer {employee.name}</DialogTitle>
          <DialogDescription>
            Move this {employee.level.name} under a different{" "}
            {managerLevel ? managerLevel.name : "manager"}. Their whole team moves with them.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-3 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <UserAvatar name={employee.manager?.name ?? "?"} className="size-6" textClassName="text-[9px]" />
            <span className="max-w-28 truncate text-muted-foreground">
              {employee.manager?.name ?? "—"}
            </span>
          </div>
          <ArrowRight className="size-4 shrink-0 text-primary" />
          <div className="flex items-center gap-2">
            {managerId ? (
              <>
                <UserAvatar
                  name={managers?.find((m) => m.id === managerId)?.name ?? "?"}
                  className="size-6"
                  textClassName="text-[9px]"
                />
                <span className="max-w-28 truncate font-medium">
                  {managers?.find((m) => m.id === managerId)?.name}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">new manager</span>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>New manager</Label>
          <Select value={managerId} onValueChange={setManagerId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={managers === null ? "Loading…" : "Pick a manager"} />
            </SelectTrigger>
            <SelectContent>
              {(managers ?? []).map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name} · {m.employeeId}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {managers?.length === 0 && (
            <p className="text-xs text-muted-foreground">No other eligible managers found.</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!managerId || saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Transfer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
