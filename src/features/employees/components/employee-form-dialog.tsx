"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "@/components/shell/session-provider";
import { CREATABLE_ROLES, MANAGER_ROLE } from "@/lib/rbac";
import { ROLE_LABELS } from "@/lib/constants";
import type { EmployeeRow } from "../types";

interface ManagerOption {
  id: string;
  name: string;
  employeeId: string;
}

export function EmployeeFormDialog({
  open,
  onOpenChange,
  employee,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog edits this employee instead of creating one. */
  employee?: EmployeeRow | null;
  onSaved: () => void;
}) {
  const session = useSession();
  const isEdit = !!employee;
  const creatableRoles = CREATABLE_ROLES[session.role];

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: creatableRoles[creatableRoles.length - 1] ?? Role.CPE,
    managerId: "",
    password: "",
    city: "",
    state: "",
  });
  const [managers, setManagers] = useState<ManagerOption[] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      name: employee?.name ?? "",
      email: employee?.email ?? "",
      phone: employee?.phone ?? "",
      role: employee?.role ?? creatableRoles[creatableRoles.length - 1] ?? Role.CPE,
      managerId: "",
      password: "",
      city: employee?.city ?? "",
      state: employee?.state ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, employee]);

  // Creating: when the actor isn't the natural manager for the chosen role, list eligible managers.
  const requiredManagerRole = MANAGER_ROLE[form.role];
  const needsManagerPick = !isEdit && requiredManagerRole && requiredManagerRole !== session.role;

  useEffect(() => {
    if (!open || !needsManagerPick) return;
    setManagers(null);
    fetch(`/api/employees?role=${requiredManagerRole}&status=ACTIVE&pageSize=200`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setManagers(data?.employees ?? []))
      .catch(() => setManagers([]));
  }, [open, needsManagerPick, requiredManagerRole]);

  const canSubmit = useMemo(() => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) return false;
    if (!isEdit && form.password.length < 8) return false;
    if (needsManagerPick && !form.managerId) return false;
    return true;
  }, [form, isEdit, needsManagerPick]);

  async function submit() {
    if (saving || !canSubmit) return;
    setSaving(true);
    try {
      const res = await fetch(isEdit ? `/api/employees/${employee!.id}` : "/api/employees", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEdit
            ? {
                name: form.name,
                email: form.email,
                phone: form.phone,
                city: form.city,
                state: form.state,
                ...(form.password ? { password: form.password } : {}),
              }
            : {
                name: form.name,
                email: form.email,
                phone: form.phone,
                role: form.role,
                password: form.password,
                city: form.city,
                state: form.state,
                ...(form.managerId ? { managerId: form.managerId } : {}),
              }
        ),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong");
        return;
      }
      toast.success(isEdit ? "Employee updated" : `${form.name} added to the team`);
      onOpenChange(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${employee!.name}` : "Add employee"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the employee's details."
              : "Create an account for a new team member. They sign in with the email and password you set."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ef-name">Full name</Label>
              <Input id="ef-name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Asha Patel" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ef-phone">Phone</Label>
              <Input id="ef-phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="9876543210" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ef-email">Email</Label>
            <Input id="ef-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="asha@vkgroup.in" />
          </div>

          {!isEdit && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <Select value={form.role} onValueChange={(v) => set("role", v as Role)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {creatableRoles.map((r) => (
                        <SelectItem key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ef-password">Temp password</Label>
                  <Input
                    id="ef-password"
                    type="text"
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    placeholder="min 8 characters"
                  />
                </div>
              </div>

              {needsManagerPick && (
                <div className="space-y-1.5">
                  <Label>Reports to ({ROLE_LABELS[requiredManagerRole!]})</Label>
                  <Select value={form.managerId} onValueChange={(v) => set("managerId", v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={managers === null ? "Loading…" : `Pick a ${ROLE_LABELS[requiredManagerRole!]}`}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {(managers ?? []).map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name} · {m.employeeId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          {isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="ef-newpass">Reset password (optional)</Label>
              <Input
                id="ef-newpass"
                type="text"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="Leave blank to keep current password"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ef-city">City</Label>
              <Input id="ef-city" value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Lucknow" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ef-state">State</Label>
              <Input id="ef-state" value={form.state} onChange={(e) => set("state", e.target.value)} placeholder="Uttar Pradesh" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit || saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? "Save changes" : "Create employee"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
