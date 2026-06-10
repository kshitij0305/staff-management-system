"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ProspectStatus } from "@prisma/client";
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
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROSPECT_STATUS_LABELS } from "@/lib/constants";
import type { ProspectRow } from "../types";

export function ProspectFormDialog({
  open,
  onOpenChange,
  prospect,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, edits this prospect instead of creating a new one. */
  prospect?: ProspectRow | null;
  onSaved: () => void;
}) {
  const isEdit = !!prospect;
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    visitDate: new Date(),
    status: ProspectStatus.FOLLOW_UP as ProspectStatus,
    remarks: "",
  });
  const [dateOpen, setDateOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      customerName: prospect?.customerName ?? "",
      phone: prospect?.phone ?? "",
      address: prospect?.address ?? "",
      city: prospect?.city ?? "",
      state: prospect?.state ?? "",
      visitDate: prospect ? new Date(prospect.visitDate) : new Date(),
      status: prospect?.status ?? ProspectStatus.FOLLOW_UP,
      remarks: prospect?.remarks ?? "",
    });
  }, [open, prospect]);

  const canSubmit =
    form.customerName.trim().length >= 2 &&
    form.phone.trim().length >= 8 &&
    form.address.trim().length >= 3 &&
    form.city.trim().length >= 2 &&
    form.state.trim().length >= 2;

  async function submit() {
    if (!canSubmit || saving) return;
    setSaving(true);
    try {
      const res = await fetch(isEdit ? `/api/prospects/${prospect!.id}` : "/api/prospects", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, visitDate: form.visitDate.toISOString() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong");
        return;
      }
      toast.success(isEdit ? "Prospect updated" : "Prospect added 🎉");
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
          <DialogTitle>{isEdit ? "Edit prospect" : "Add prospect"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the prospect's details or status."
              : "Record a customer you visited in the field."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pf-name">Customer name</Label>
              <Input
                id="pf-name"
                value={form.customerName}
                onChange={(e) => set("customerName", e.target.value)}
                placeholder="Ramesh Gupta"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-phone">Phone</Label>
              <Input
                id="pf-phone"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="9876543210"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-address">Address</Label>
            <Input
              id="pf-address"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="42, MG Road"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pf-city">City</Label>
              <Input
                id="pf-city"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="Lucknow"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-state">State</Label>
              <Input
                id="pf-state"
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
                placeholder="Uttar Pradesh"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Visit date</Label>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal">
                    <CalendarIcon className="size-3.5 text-muted-foreground" />
                    {format(form.visitDate, "d MMM yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.visitDate}
                    onSelect={(d) => {
                      if (d) set("visitDate", d);
                      setDateOpen(false);
                    }}
                    disabled={{ after: new Date() }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v as ProspectStatus)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ProspectStatus).map((s) => (
                    <SelectItem key={s} value={s}>
                      {PROSPECT_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-remarks">Remarks</Label>
            <Textarea
              id="pf-remarks"
              value={form.remarks}
              onChange={(e) => set("remarks", e.target.value)}
              placeholder="Wants a quote for 3kW rooftop system…"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit || saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? "Save changes" : "Add prospect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
